import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { OPERATION_TYPES, ENTITY_TYPES, DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';

export interface QueueOperation {
  id: number;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  payload: string | null;
  created_at: string;
  retry_count: number;
  max_retries: number;
  status: string;
}

/**
 * Sync queue management for offline operations
 * 🚨 DISABLED: Auto-sync functionality removed - operations disabled but UI functions kept
 */
export const syncQueueService = {
  /**
   * Add operation to sync queue (ENABLED for tracking)
   * Records ALL operations without deduplication - every action creates a new queue entry
   */
  addToQueue: async (
    operationType: string,
    entityType: string,
    entityId: string,
    payload?: any
  ): Promise<number> => {
    const db = DatabaseInit.getInstance().getDatabase();
    const timestamp = DatabaseHelpers.getCurrentTimestamp();

    // Enhance payload for CREATE operations
    let enhancedPayload = payload;
    if (operationType === OPERATION_TYPES.CREATE && entityType === ENTITY_TYPES.NOTE) {
      enhancedPayload = {
        ...payload,
        localId: entityId,
        originalEntityId: entityId
      };
    }

    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // REMOVED DUPLICATE CHECK - Always insert new operation for complete tracking
        // This ensures every bookmark/unbookmark action creates a separate queue entry
        
        tx.executeSql(
          `INSERT INTO sync_queue (
            operation_type, entity_type, entity_id, payload, 
            created_at, retry_count, max_retries, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operationType,
            entityType,
            entityId,
            enhancedPayload ? JSON.stringify(enhancedPayload) : null,
            timestamp,
            0, // retry_count
            3, // max_retries
            'pending'
          ],
          (_, result) => {
            resolve(result.insertId!);
          },
          (_, error) => {
            console.error('❌ Error adding to sync queue:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Get all pending operations from queue (returns empty for UI)
   * 🚨 DISABLED: Returns empty array for UI compatibility
   */
  getPendingOperations: async (): Promise<QueueOperation[]> => {
    // 🚨 DISABLED: Returns empty array for UI compatibility
    return Promise.resolve([]);
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM sync_queue 
           WHERE status = 'pending' 
           ORDER BY created_at ASC`,
          [],
          (_, result) => {
            const operations: QueueOperation[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              operations.push(result.rows.item(i));
            }
            resolve(operations);
          },
          (_, error) => {
            console.error('Error fetching pending operations:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Mark operation as completed and remove from queue (DISABLED)
   * 🚨 DISABLED: No operations to mark as completed
   */
  markOperationCompleted: async (operationId: number): Promise<void> => {
    // 🚨 DISABLED: No operations to mark as completed
    return Promise.resolve();
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM sync_queue WHERE id = ?`,
          [operationId],
          (_, result) => {
            resolve();
          },
          (_, error) => {
            console.error('Error marking operation as completed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Increment retry count for failed operation (DISABLED)
   * 🚨 DISABLED: No operations to retry
   */
  incrementRetryCount: async (operationId: number): Promise<boolean> => {
    // 🚨 DISABLED: No operations to retry
    return Promise.resolve(false);
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // First get current retry count
        tx.executeSql(
          `SELECT retry_count, max_retries FROM sync_queue WHERE id = ?`,
          [operationId],
          (_, result) => {
            if (result.rows.length === 0) {
              resolve(false);
              return;
            }
            
            const row = result.rows.item(0);
            const newRetryCount = row.retry_count + 1;
            const maxRetries = row.max_retries;
            
            if (newRetryCount >= maxRetries) {
              // Mark as failed if max retries reached
              tx.executeSql(
                `UPDATE sync_queue SET 
                 retry_count = ?, 
                 status = 'failed' 
                 WHERE id = ?`,
                [newRetryCount, operationId],
                (_, result) => {
                  resolve(false); // No more retries
                },
                (_, error) => {
                  console.error('Error marking operation as failed:', error);
                  reject(error);
                  return false;
                }
              );
            } else {
              // Increment retry count
              tx.executeSql(
                `UPDATE sync_queue SET retry_count = ? WHERE id = ?`,
                [newRetryCount, operationId],
                (_, result) => {
                  resolve(true); // Can retry
                },
                (_, error) => {
                  console.error('Error incrementing retry count:', error);
                  reject(error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Error fetching operation for retry:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Get failed operations that can be manually retried (returns empty for UI)
   * 🚨 DISABLED: Returns empty array for UI compatibility
   */
  getFailedOperations: async (): Promise<QueueOperation[]> => {
    // 🚨 DISABLED: Returns empty array for UI compatibility
    return Promise.resolve([]);
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM sync_queue 
           WHERE status = 'failed' 
           ORDER BY created_at DESC`,
          [],
          (_, result) => {
            const operations: QueueOperation[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              operations.push(result.rows.item(i));
            }
            resolve(operations);
          },
          (_, error) => {
            console.error('Error fetching failed operations:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Reset failed operation for manual retry (DISABLED)
   * 🚨 DISABLED: No operations to reset
   */
  resetFailedOperation: async (operationId: number): Promise<void> => {
    // 🚨 DISABLED: No operations to reset
    return Promise.resolve();
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE sync_queue SET 
           status = 'pending', 
           retry_count = 0 
           WHERE id = ?`,
          [operationId],
          (_, result) => {
            resolve();
          },
          (_, error) => {
            console.error('Error resetting failed operation:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Get queue status summary (returns zero counts for UI)
   * 🚨 DISABLED: Returns zero counts for UI compatibility
   */
  getQueueStatus: async (): Promise<{pending: number, failed: number}> => {
    // 🚨 DISABLED: Returns zero counts for UI compatibility
    return Promise.resolve({ pending: 0, failed: 0 });
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT status, COUNT(*) as count 
           FROM sync_queue 
           WHERE status IN ('pending', 'failed') 
           GROUP BY status`,
          [],
          (_, result) => {
            let pending = 0;
            let failed = 0;
            
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              if (row.status === 'pending') pending = row.count;
              if (row.status === 'failed') failed = row.count;
            }
            
            resolve({ pending, failed });
          },
          (_, error) => {
            console.error('Error fetching queue status:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * ✅ ENABLED: Get ALL operations from sync queue for Sync Management FlashList
   * This shows persistent database results as requested by user
   */
  getAllOperations: async (): Promise<QueueOperation[]> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM sync_queue 
           ORDER BY created_at DESC`,
          [],
          (_, result) => {
            const operations: QueueOperation[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              operations.push({
                id: row.id,
                operation_type: row.operation_type,
                entity_type: row.entity_type,
                entity_id: row.entity_id,
                payload: row.payload,
                created_at: row.created_at,
                retry_count: row.retry_count,
                max_retries: row.max_retries,
                status: row.status
              });
            }
            
            resolve(operations);
          },
          (_, error) => {
            console.error('❌ Error fetching all sync operations:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * ✅ ENABLED: Get queue status with real database counts
   * Shows actual persistent results from database
   */
  getRealQueueStatus: async (): Promise<{pending: number, failed: number, completed: number, total: number}> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
           FROM sync_queue`,
          [],
          (_, result) => {
            const row = result.rows.item(0);
            const status = {
              pending: row.pending || 0,
              failed: row.failed || 0,
              completed: row.completed || 0,
              total: row.total || 0
            };
            
            resolve(status);
          },
          (_, error) => {
            console.error('❌ Error fetching real queue status:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Clear all completed operations from queue (DISABLED)
   * 🚨 DISABLED: No operations to clear
   */
  clearCompletedOperations: async (): Promise<void> => {
    // 🚨 DISABLED: No operations to clear
    return Promise.resolve();
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `DELETE FROM sync_queue WHERE status = 'completed'`,
          [],
          (_, result) => {
            resolve();
          },
          (_, error) => {
            console.error('Error clearing completed operations:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },

  /**
   * Update entity ID in sync queue (DISABLED)
   * 🚨 DISABLED: No operations to update
   */
  updateEntityId: async (operationId: number, newEntityId: string): Promise<void> => {
    // 🚨 DISABLED: No operations to update
    return Promise.resolve();
    
    /*
    // TODO: Uncomment for future sync implementation
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE sync_queue SET entity_id = ? WHERE id = ?`,
          [newEntityId, operationId],
          (_, result) => {
            if (result.rowsAffected > 0) {
            } else {
            }
            resolve();
          },
          (_, error) => {
            console.error('Error updating entity ID in sync queue:', error);
            reject(error);
            return false;
          }
        );
      });
    });
    */
  },
}; 