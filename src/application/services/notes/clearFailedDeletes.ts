import { syncQueueService } from './syncQueueService';
import { OPERATION_TYPES } from '../../../infrastructure/storage/DatabaseSchema';

/**
 * Utility to clean up failed delete operations that are stuck in retry loops
 * This is a temporary fix for the 404 delete issue
 */
export const clearFailedDeleteOperations = async (): Promise<{
  cleared: number;
  operations: string[];
}> => {
  try {
    
    // Get all failed operations
    const failedOps = await syncQueueService.getFailedOperations();
    
    // Filter for delete operations
    const failedDeletes = failedOps.filter(
      op => op.operation_type === OPERATION_TYPES.DELETE
    );
    
    
    const clearedOperations: string[] = [];
    
    // Mark them as completed (removes from queue)
    for (const op of failedDeletes) {
      await syncQueueService.markOperationCompleted(op.id);
      clearedOperations.push(op.entity_id);
    }
    
    
    return {
      cleared: failedDeletes.length,
      operations: clearedOperations
    };
    
  } catch (error) {
    console.error('❌ Error cleaning up failed delete operations:', error);
    return {
      cleared: 0,
      operations: []
    };
  }
}; 