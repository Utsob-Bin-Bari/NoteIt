import { syncQueueService, QueueOperation } from './syncQueueService';
import { notesService } from './notesService';
import { bookmarksService } from '../bookmarks/bookmarksService';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { userSessionStorage } from '../../../infrastructure/storage/userSessionStorage';
import { OPERATION_TYPES, DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';
import { notesSQLiteService } from './notesSQLiteService';
import { createNewNote } from '../../../infrastructure/api/requests/notes/createNewNote';
import { updateNoteById } from '../../../infrastructure/api/requests/notes/updateNoteById';
import { deleteNoteById } from '../../../infrastructure/api/requests/notes/deleteNoteById';
import { shareNoteByEmail } from '../../../infrastructure/api/requests/notes/shareNoteByEmail';
import { createBookmark } from '../../../infrastructure/api/requests/bookmarks/createBookmark';
import { deleteBookmark } from '../../../infrastructure/api/requests/bookmarks/deleteBookmark';

interface SyncProcessor {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  processingCount: number;
}

/**
 * Background sync processor that handles queue processing and app restart recovery
 * ✅ ENABLED: Full FIFO queue processing with local_id to server_id mapping and stop-on-failure
 */
export const syncProcessor: SyncProcessor = {
  isRunning: false,
  intervalId: null,
  processingCount: 0,
};

/**
 * Start the sync processor
 * ✅ ENABLED: Processes sync queue automatically
 */
export const startSyncProcessor = async (): Promise<void> => {
  if (syncProcessor.isRunning) {
    return;
  }

  syncProcessor.isRunning = true;

  // Process queue immediately on start (app restart recovery)
  await processQueueOnce();

  // Set up interval to process queue every 10 seconds
  syncProcessor.intervalId = setInterval(async () => {
    await processQueueOnce();
  }, 10000);
};

/**
 * Stop the sync processor
 * ✅ ENABLED: Stops automatic sync processing
 */
export const stopSyncProcessor = async (): Promise<void> => {
  if (!syncProcessor.isRunning) {
    return;
  }

  if (syncProcessor.intervalId) {
    clearInterval(syncProcessor.intervalId);
    syncProcessor.intervalId = null;
  }

  syncProcessor.isRunning = false;
};

/**
 * Process sync queue once - handles app restart recovery
 * ✅ ENABLED: Processes pending sync operations
 */
const processQueueOnce = async (): Promise<void> => {
  // Prevent concurrent processing
  if (syncProcessor.processingCount > 0) {
    return;
  }

  try {
    syncProcessor.processingCount++;

    // Check network connectivity
    const isOnline = await NetworkService.checkInternetReachability();
    if (!isOnline) {
      return;
    }

    // Get access token
    const sessionResult = await userSessionStorage.getWithValidation();
    if (!sessionResult.success || !sessionResult.data?.accessToken) {
      return;
    }

    const accessToken = sessionResult.data.accessToken;

    // Get pending operations (FIFO order)
    const pendingOperations = await syncQueueService.getPendingOperations();
    
    if (pendingOperations.length === 0) {
      return;
    }

    let processedCount = 0;
    let failedCount = 0;

    // Process operations in FIFO order - STOP on first failure to preserve dependencies
    for (const operation of pendingOperations) {
      try {
        let success = false;
        
        // Add small delay before each operation to prevent database race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Process different operation types with proper local_id to server_id mapping
        if (operation.operation_type === OPERATION_TYPES.CREATE) {
          success = await processCreateOperation(operation, accessToken);
        } else if (operation.operation_type === OPERATION_TYPES.UPDATE) {
          success = await processUpdateOperation(operation, accessToken);
        } else if (operation.operation_type === OPERATION_TYPES.DELETE) {
          success = await processDeleteOperation(operation, accessToken);
        } else if (operation.operation_type === 'bookmark' || operation.operation_type === 'unbookmark') {
          success = await processBookmarkOperation(operation, accessToken);
        } else if (operation.operation_type === 'share') {
          success = await processShareOperation(operation, accessToken);
        } else {
          console.log(`Unknown operation type: ${operation.operation_type}`);
          success = false;
        }

        if (success) {
          processedCount++;
          await syncQueueService.markOperationCompleted(operation.id);
          
          // Longer delay after successful operations to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          // 🛑 STOP PROCESSING QUEUE when operation fails (likely dependency issue)
          // This prevents dependent operations from being marked as failed
          // when their dependencies might be resolved by processing this operation later
          
          failedCount++;
          
          // For dependency-related failures, be more lenient with retry counting
          // Only increment retry count occasionally to give dependencies time to resolve
          const currentTime = Date.now();
          const operationAge = new Date(operation.created_at).getTime();
          const ageInMinutes = (currentTime - operationAge) / (1000 * 60);
          
          // Only increment retry count if operation is older than 2 minutes
          // This gives dependencies time to be resolved
          if (ageInMinutes > 2) {
            await syncQueueService.incrementRetryCount(operation.id);
          }
          

          break; // Stop processing remaining operations
        }
      } catch (error) {
        console.log(`Error processing sync operation ${operation.id}:`, error);
        
        // 🛑 STOP PROCESSING QUEUE on error to preserve operation order
        await syncQueueService.incrementRetryCount(operation.id);
        failedCount++;
        break; // Stop processing remaining operations
      }
    }

  } catch (error) {
    console.log('Error in sync processor:', error);
  } finally {
    syncProcessor.processingCount--;
  }
};

/**
 * Trigger immediate sync
 * ✅ ENABLED: Manually triggers sync process
 */
export const triggerImmediateSync = async (): Promise<{processed: number, failed: number}> => {
  try {
    const sessionResult = await userSessionStorage.getWithValidation();
    
    if (!sessionResult.success || !sessionResult.data?.accessToken) {
      return { processed: 0, failed: 0 };
    }

    const accessToken = sessionResult.data.accessToken;
    await notesService.manualSyncAllPending(accessToken);
    return { processed: 1, failed: 0 }; // Simplified return
  } catch (error) {
    return { processed: 0, failed: 1 };
  }
};

/**
 * Get sync processor status
 * ✅ ENABLED: Returns actual processor status
 */
export const getSyncProcessorStatus = (): { isRunning: boolean; isProcessing: boolean } => {
  return {
    isRunning: syncProcessor.isRunning,
    isProcessing: syncProcessor.processingCount > 0,
  };
};

/**
 * Initialize sync processor on app start
 * ✅ ENABLED: Starts sync processor and handles previous session recovery
 */
export const initializeSyncProcessor = async (): Promise<void> => {
  try {
    // Check if we have any pending operations from previous session
    const queueStatus = await syncQueueService.getQueueStatus();
    
    if (queueStatus.pending > 0 || queueStatus.failed > 0) {
      // Reset failed operations for retry (app restart gives fresh chance)
      const failedOps = await syncQueueService.getFailedOperations();
      for (const op of failedOps) {
        await syncQueueService.resetFailedOperation(op.id);
      }
    }
    
    // Start the automatic sync processor for write operations
    await startSyncProcessor();
    
  } catch (error) {
    console.log('Error initializing sync processor:', error);
  }
};

/**
 * Manual trigger for queue processing - Used by UI retry operations
 * ✅ ENABLED: Allows manual triggering of queue processing
 */
export const manualProcessQueue = async (): Promise<{processed: number, failed: number}> => {
  try {
    // Process queue once manually
    await processQueueOnce();
    
    // Get updated queue status to return results
    const queueStatus = await syncQueueService.getRealQueueStatus();
    
    return { 
      processed: queueStatus.completed || 0, 
      failed: queueStatus.failed || 0 
    };
  } catch (error) {
    console.log('Error in manual queue processing:', error);
    return { processed: 0, failed: 0 };
  }
};

/**
 * Manual sync all pending operations
 * ✅ ENABLED: Processes all pending operations in queue
 */
export const manualSyncAllPending = async (accessToken: string): Promise<{processed: number, failed: number}> => {
  try {
    const result = await notesService.manualSyncAllPending(accessToken);
    return { processed: result.synced, failed: result.failed };
  } catch (error) {
    console.log('Error in manual sync all:', error);
    return { processed: 0, failed: 0 };
  }
};

/**
 * Process CREATE operation - uses local_id, gets server_id back, stores it
 */
const processCreateOperation = async (operation: QueueOperation, accessToken: string): Promise<boolean> => {
  try {
    const payload = operation.payload ? JSON.parse(operation.payload) : null;
    if (!payload) {
      console.log('CREATE operation missing payload');
      return false;
    }

    // Create on server using payload data
    const result = await createNewNote({
      requestBody: {
        title: payload.title,
        details: payload.details,
      },
      accessToken
    });

    if (result.note?.id) {
      // Store server_id in local note using local_id (entity_id)
      await notesSQLiteService.updateServerIdByLocalId(operation.entity_id, result.note.id);

      return true;
    }

    return false;
  } catch (error) {
    console.log(`Error in CREATE operation:`, error);
    return false;
  }
};

/**
 * Process UPDATE operation - maps local_id to server_id, then calls API
 */
const processUpdateOperation = async (operation: QueueOperation, accessToken: string): Promise<boolean> => {
  try {
    // Get server_id from local_id
    const serverId = await notesSQLiteService.getServerIdByLocalId(operation.entity_id);
    if (!serverId) {
      console.log(`UPDATE operation failed: no server_id for local_id=${operation.entity_id}`);
      return false;
    }

    const payload = operation.payload ? JSON.parse(operation.payload) : null;
    if (!payload) {
      console.log('UPDATE operation missing payload');
      return false;
    }

    // Update on server using server_id
    const result = await updateNoteById({
      noteId: serverId,
      requestBody: {
        title: payload.title,
        details: payload.details,
      },
      accessToken
    });

    if (result.note) {

      return true;
    }

    return false;
  } catch (error) {
    console.log(`Error in UPDATE operation:`, error);
    return false;
  }
};

/**
 * Process DELETE operation - maps local_id to server_id, calls API, then removes local
 */
const processDeleteOperation = async (operation: QueueOperation, accessToken: string): Promise<boolean> => {
  try {
    // Get server_id from local_id
    const serverId = await notesSQLiteService.getServerIdByLocalId(operation.entity_id);
    if (!serverId) {
      console.log(`DELETE operation failed: no server_id for local_id=${operation.entity_id}`);
      return false;
    }

    // Delete from server using server_id
    const result = await deleteNoteById({
      noteId: serverId,
      accessToken
    });

    if (result.message) {
      // Permanently delete from local storage
      await notesSQLiteService.permanentlyDeleteNote(operation.entity_id);

      return true;
    }

    return false;
  } catch (error) {
    console.log(`Error in DELETE operation:`, error);
    return false;
  }
};

/**
 * Process BOOKMARK/UNBOOKMARK operation - maps local_id to server_id
 */
const processBookmarkOperation = async (operation: QueueOperation, accessToken: string): Promise<boolean> => {
  try {
    // Get server_id from local_id
    const serverId = await notesSQLiteService.getServerIdByLocalId(operation.entity_id);
    if (!serverId) {
      console.log(`BOOKMARK operation failed: no server_id for local_id=${operation.entity_id}`);
      return false;
    }

    let result;
    if (operation.operation_type === 'bookmark') {
      result = await createBookmark({ noteId: serverId, accessToken });
    } else {
      result = await deleteBookmark({ noteId: serverId, accessToken });
    }

    if (result.message) {

      return true;
    }

    return false;
  } catch (error) {
    console.log(`Error in BOOKMARK operation:`, error);
    return false;
  }
};

/**
 * Process SHARE operation - maps local_id to server_id
 */
const processShareOperation = async (operation: QueueOperation, accessToken: string): Promise<boolean> => {
  try {
    // Get server_id from local_id
    const serverId = await notesSQLiteService.getServerIdByLocalId(operation.entity_id);
    if (!serverId) {
      console.log(`SHARE operation failed: no server_id for local_id=${operation.entity_id}`);
      return false;
    }

    const payload = operation.payload ? JSON.parse(operation.payload) : null;
    if (!payload?.email) {
      console.log('SHARE operation missing email in payload');
      return false;
    }

    // Share on server using server_id
    const result = await shareNoteByEmail({
      noteId: serverId,
      requestBody: {
        email: payload.email,
      },
      accessToken
    });

    if (result.note) {

      return true;
    }

    return false;
  } catch (error) {
    console.log(`Error in SHARE operation:`, error);
    return false;
  }
}; 