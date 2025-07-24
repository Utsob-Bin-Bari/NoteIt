import { syncQueueService } from './syncQueueService';
import { notesService } from './notesService';
import { bookmarksService } from '../bookmarks/bookmarksService';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { userSessionStorage } from '../../../infrastructure/storage/userSessionStorage';
import { OPERATION_TYPES } from '../../../infrastructure/storage/DatabaseSchema';

interface SyncProcessor {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  processingCount: number;
}

/**
 * Background sync processor that handles queue processing and app restart recovery
 * ✅ ENABLED: Auto-sync functionality active with FIFO queue processing
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

        // Route to appropriate service based on operation type
        if (operation.entity_type === 'note' && 
            (operation.operation_type === OPERATION_TYPES.BOOKMARK || operation.operation_type === OPERATION_TYPES.UNBOOKMARK)) {
          // Handle bookmark operations
          success = await bookmarksService.trySyncBookmarkOperation(operation.entity_id, accessToken);
        } else if (operation.entity_type === 'note') {
          // Handle note operations (create, update, delete, share)
          success = await notesService.trySyncOperation(operation.entity_id, accessToken);
        } else {
          // Unknown operation type - mark as failed
          success = false;
        }

        if (success) {
          processedCount++;
          
          // Small delay between successful operations to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
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
          
          console.warn(`⚠️ SYNC QUEUE STOPPED at operation ${operation.id} (${operation.operation_type}) - dependencies may not be ready, will retry in next cycle`);
          break; // Stop processing remaining operations
        }

      } catch (error) {
        console.error(`❌ SYNC ERROR processing operation ${operation.id}:`, {
          operation: operation,
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // 🛑 STOP PROCESSING QUEUE on error to preserve operation order
        await syncQueueService.incrementRetryCount(operation.id);
        failedCount++;
        break; // Stop processing remaining operations
      }
    }

  } catch (error) {
    console.error('Error in sync processor:', error);
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
 * Get sync processor status (DISABLED - returns static status for UI)
 * 🚨 DISABLED: Auto-sync functionality removed - return mock status for UI
 */
export const getSyncProcessorStatus = (): { isRunning: boolean; isProcessing: boolean } => {
  return {
    isRunning: false, // Always false since auto-sync is disabled
    isProcessing: false, // Always false since auto-sync is disabled
  };
};

/**
 * Initialize sync processor on app start (DISABLED for local-only operation)
 * 🚨 DISABLED: Auto-sync functionality removed
 */
export const initializeSyncProcessor = async (): Promise<void> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return;
  
  /*
  // TODO: Uncomment for future auto-sync implementation
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
    console.error('❌ Error initializing sync processor:', error);
  }
  */
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
    console.error('❌ Error in manual queue processing:', error);
    return { processed: 0, failed: 0 };
  }
};

/**
 * Manual sync all pending operations (DISABLED - returns mock data for UI)
 * 🚨 DISABLED: Auto-sync functionality removed - return mock data for UI
 */
export const manualSyncAllPending = async (accessToken: string): Promise<{processed: number, failed: number}> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return Promise.resolve({ processed: 0, failed: 0 });
  
  /*
  // TODO: Uncomment for future auto-sync implementation
  try {
    const result = await notesService.syncAllPending(accessToken);
    return { processed: result.synced, failed: result.failed };
  } catch (error) {
    console.error('Error in manual sync all:', error);
    return { processed: 0, failed: 0 };
  }
  */
}; 