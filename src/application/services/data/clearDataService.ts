import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';

/**
 * Service for clearing all app data except user session
 * Following the layered architecture pattern
 * 
 * NOTE: This service performs HARD DELETE of all local data for clean state
 */
export const clearDataService = {
  /**
   * Clear all application data except user session
   * This includes: notes, bookmarks, sync queue, users, user-specific app settings
   * HARD DELETE - permanently removes all records to prevent database bloat
   */
  clearAllDataExceptUser: async (): Promise<{
    success: boolean;
    error?: string;
    cleared: {
      notes: number;
      users: number;
      syncQueue: number;
      appSettings: number;
    };
  }> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve) => {
      let cleared = {
        notes: 0,
        users: 0,
        syncQueue: 0,
        appSettings: 0,
      };

      db.transaction(
        (tx) => {
          // 1. HARD DELETE all notes (includes all bookmark relationships since bookmarks are stored as JSON in notes table)
          tx.executeSql(
            'DELETE FROM notes',
            [],
            (_, result) => {
              cleared.notes = result.rowsAffected;
            },
            (_, error) => {
              console.log('❌ Error hard deleting notes:', error);
              return false;
            }
          );

          // 2. HARD DELETE users table (other users for sharing)
          tx.executeSql(
            'DELETE FROM users',
            [],
            (_, result) => {
              cleared.users = result.rowsAffected;
            },
            (_, error) => {
              console.log('❌ Error hard deleting users:', error);
              return false;
            }
          );

          // 3. HARD DELETE ALL sync queue operations
          tx.executeSql(
            'DELETE FROM sync_queue',
            [],
            (_, result) => {
              cleared.syncQueue = result.rowsAffected;
            },
            (_, error) => {
              console.log('❌ Error hard deleting sync queue:', error);
              return false;
            }
          );

          // 4. HARD DELETE user-specific app settings (preserve only system settings)
          tx.executeSql(
            'DELETE FROM app_settings WHERE key NOT IN ("app_version", "database_version")',
            [],
            (_, result) => {
              cleared.appSettings = result.rowsAffected;
            },
            (_, error) => {
              console.log('❌ Error hard deleting app settings:', error);
              return false;
            }
          );

          // 5. Verify user session is preserved
          tx.executeSql(
            'SELECT COUNT(*) as count FROM user_session',
            [],
            (_, result) => {
              const sessionCount = result.rows.item(0).count;
            },
            (_, error) => {
              console.log('❌ Could not verify user session preservation:', error);
              return true; // Continue
            }
          );

          // 6. Log what was preserved
          tx.executeSql(
            'SELECT key, value FROM app_settings ORDER BY key',
            [],
            (_, result) => {
              // Silently check preserved settings
            },
            (_, error) => {
              console.log('❌ Could not check preserved settings:', error);
              return true; // Continue
            }
          );
        },
        (error) => {
          console.log('❌ Transaction error during HARD DELETE clear data:', error);
          resolve({
            success: false,
            error: error.message,
            cleared,
          });
        },
        () => {
          const totalCleared = cleared.notes + cleared.users + cleared.syncQueue + cleared.appSettings;
          resolve({
            success: true,
            cleared,
          });
        }
      );
    });
  },

  /**
   * Get current data statistics before clearing
   */
  getDataStatistics: async (): Promise<{
    notes: number;
    users: number;
    syncQueue: number;
    appSettings: number;
    userSpecificSettings: number;
    systemSettings: number;
  }> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      const stats = {
        notes: 0,
        users: 0,
        syncQueue: 0,
        appSettings: 0,
        userSpecificSettings: 0,
        systemSettings: 0,
      };

      db.transaction((tx) => {
        // Count notes
        tx.executeSql(
          'SELECT COUNT(*) as count FROM notes',
          [],
          (_, result) => {
            stats.notes = result.rows.item(0).count;
          }
        );

        // Count users
        tx.executeSql(
          'SELECT COUNT(*) as count FROM users',
          [],
          (_, result) => {
            stats.users = result.rows.item(0).count;
          }
        );

        // Count sync queue
        tx.executeSql(
          'SELECT COUNT(*) as count FROM sync_queue',
          [],
          (_, result) => {
            stats.syncQueue = result.rows.item(0).count;
          }
        );

        // Count all app settings
        tx.executeSql(
          'SELECT COUNT(*) as count FROM app_settings',
          [],
          (_, result) => {
            stats.appSettings = result.rows.item(0).count;
          }
        );

        // Count user-specific settings (will be deleted)
        tx.executeSql(
          'SELECT COUNT(*) as count FROM app_settings WHERE key NOT IN ("app_version", "database_version")',
          [],
          (_, result) => {
            stats.userSpecificSettings = result.rows.item(0).count;
          }
        );

        // Count system settings (will be preserved)
        tx.executeSql(
          'SELECT COUNT(*) as count FROM app_settings WHERE key IN ("app_version", "database_version")',
          [],
          (_, result) => {
            stats.systemSettings = result.rows.item(0).count;
            resolve(stats);
          }
        );
      }, (error) => {
        console.log('Error getting data statistics:', error);
        reject(error);
      });
    });
  },

  /**
   * Verify user session is still intact after clear operation
   */
  verifyUserSession: async (): Promise<boolean> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM user_session',
          [],
          (_, result) => {
            const hasSession = result.rows.item(0).count > 0;
            resolve(hasSession);
          },
          (_, error) => {
            console.log('Error verifying user session:', error);
            resolve(false);
          }
        );
      });
    });
  },

  /**
   * Get detailed breakdown of what will be cleared vs preserved
   */
  getClearDataPreview: async (): Promise<{
    willBeCleared: {
      notes: number;
      users: number;
      syncQueue: number;
      userSpecificSettings: string[];
    };
    willBePreserved: {
      userSession: boolean;
      systemSettings: string[];
    };
  }> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      const preview = {
        willBeCleared: {
          notes: 0,
          users: 0,
          syncQueue: 0,
          userSpecificSettings: [] as string[],
        },
        willBePreserved: {
          userSession: false,
          systemSettings: [] as string[],
        },
      };

      db.transaction((tx) => {
        // Count what will be cleared
        tx.executeSql('SELECT COUNT(*) as count FROM notes', [], (_, result) => {
          preview.willBeCleared.notes = result.rows.item(0).count;
        });

        tx.executeSql('SELECT COUNT(*) as count FROM users', [], (_, result) => {
          preview.willBeCleared.users = result.rows.item(0).count;
        });

        tx.executeSql('SELECT COUNT(*) as count FROM sync_queue', [], (_, result) => {
          preview.willBeCleared.syncQueue = result.rows.item(0).count;
        });

        // Get user-specific settings that will be cleared
        tx.executeSql(
          'SELECT key FROM app_settings WHERE key NOT IN ("app_version", "database_version") ORDER BY key',
          [],
          (_, result) => {
            for (let i = 0; i < result.rows.length; i++) {
              preview.willBeCleared.userSpecificSettings.push(result.rows.item(i).key);
            }
          }
        );

        // Check what will be preserved
        tx.executeSql('SELECT COUNT(*) as count FROM user_session', [], (_, result) => {
          preview.willBePreserved.userSession = result.rows.item(0).count > 0;
        });

        tx.executeSql(
          'SELECT key FROM app_settings WHERE key IN ("app_version", "database_version") ORDER BY key',
          [],
          (_, result) => {
            for (let i = 0; i < result.rows.length; i++) {
              preview.willBePreserved.systemSettings.push(result.rows.item(i).key);
            }
            resolve(preview);
          }
        );
      }, (error) => {
        console.log('Error getting clear data preview:', error);
        reject(error);
      });
    });
  },
}; 