import { syncQueueService } from './syncQueueService';
import { notesService } from './notesService';
import { bookmarksService } from '../bookmarks/bookmarksService';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { userSessionStorage } from '../../../infrastructure/storage/userSessionStorage';

interface SyncProcessor {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  processingCount: number;
}

/**
 * Background sync processor that handles queue processing and app restart recovery
 * 🚨 DISABLED: Auto-sync functionality removed for local-only operation
 */
export const syncProcessor: SyncProcessor = {
  isRunning: false,
  intervalId: null,
  processingCount: 0,
};

/**
 * Start the sync processor
 * 🚨 DISABLED: Auto-sync functionality removed
 */
export const startSyncProcessor = async (): Promise<void> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return;
  
  /* 
  // TODO: Uncomment for future auto-sync implementation
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
  */
};

/**
 * Stop the sync processor
 * 🚨 DISABLED: Auto-sync functionality removed
 */
export const stopSyncProcessor = async (): Promise<void> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return;
  
  /*
  // TODO: Uncomment for future auto-sync implementation
  if (!syncProcessor.isRunning) {
    return;
  }

  if (syncProcessor.intervalId) {
    clearInterval(syncProcessor.intervalId);
    syncProcessor.intervalId = null;
  }

  syncProcessor.isRunning = false;
  */
};

/**
 * Process sync queue once - handles app restart recovery
 * 🚨 DISABLED: Auto-sync functionality removed
 */
const processQueueOnce = async (): Promise<void> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return;
  
  /*
  // TODO: Uncomment for future auto-sync implementation
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

    // Process operations in FIFO order (first in, first out)
    for (const operation of pendingOperations) {
      try {
        let success = false;

        // Route to appropriate service based on entity type
        if (operation.entity_type === 'note') {
          success = await notesService.trySyncOperation(operation.entity_id, accessToken);
        } else if (operation.entity_type === 'bookmark') {
          success = await bookmarksService.trySyncBookmarkOperation(operation.entity_id, accessToken);
        }

        if (success) {
          processedCount++;
        } else {
          // Increment retry count, will mark as failed if max retries reached
          const canRetry = await syncQueueService.incrementRetryCount(operation.id);
          failedCount++;
        }

        // Small delay between operations to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ SYNC ERROR processing operation ${operation.id}:`, {
          operation: operation,
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        await syncQueueService.incrementRetryCount(operation.id);
        failedCount++;
      }
    }

  } catch (error) {
    console.error('Error in sync processor:', error);
  } finally {
    syncProcessor.processingCount--;
  }
  */
};

/**
 * Trigger immediate sync (DISABLED - returns mock data for UI)
 * 🚨 DISABLED: Auto-sync functionality removed - return mock data for UI
 */
export const triggerImmediateSync = async (): Promise<{processed: number, failed: number}> => {
  // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
  return Promise.resolve({ processed: 0, failed: 0 });
  
  /*
  // TODO: Uncomment for future auto-sync implementation
  try {
    const sessionResult = await userSessionStorage.getWithValidation();
    
    if (!sessionResult.success || !sessionResult.data?.accessToken) {
      return { processed: 0, failed: 0 };
    }

    const accessToken = sessionResult.data.accessToken;
    return await manualSyncAllPending(accessToken);
  } catch (error) {
    console.error('Error in immediate sync:', error);
    return { processed: 0, failed: 0 };
  }
  */
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