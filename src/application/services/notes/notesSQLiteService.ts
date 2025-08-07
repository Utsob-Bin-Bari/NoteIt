import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers, SYNC_STATUS } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';

interface LocalNote extends Note {
  sync_status: string;
  is_deleted: number;
  local_updated_at: string | null;
  needs_sync: number;
}

/**
 * Database Operation Queue - Function-based implementation
 * Ensures sequential execution of ALL SQLite operations to prevent race conditions
 */
const createDatabaseQueue = () => {
  let queue: Array<() => Promise<any>> = [];
  let isProcessing = false;

  const processNext = async () => {
    if (isProcessing || queue.length === 0) {
      return;
    }

    isProcessing = true;
    const operation = queue.shift()!;
    
    try {
      await operation();
      // Increased delay after each operation to ensure transaction isolation and commit completion
      // Boosted to 100ms for better race condition prevention
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      isProcessing = false;
      processNext(); // Process next operation
    }
  };

  const add = async <T>(operation: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      processNext();
    });
  };

  return { add };
};

const dbQueue = createDatabaseQueue();

/**
 * SQLite operations for notes data
 * 
 * NOTE: This service uses SOFT DELETE to maintain sync integrity.
 * When a note is deleted, it's marked as deleted but kept for sync queue processing.
 * After successful server sync, notes are permanently deleted to prevent bloat.
 * ALL operations are queued to ensure sequential execution and prevent race conditions.
 */
export const notesSQLiteService = {
  /**
   * Fetch all notes for current user (with bulletproof ID handling)
   * FIXED: Use local_id as primary id when server id is null
   * FIXED: Search by email in shared_with after auto-recovery converts user IDs to emails
   */
  fetchAllNotes: async (userId: string, userEmail?: string): Promise<Note[]> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        // Helper function to process notes results
        const processNotesResult = (result: any) => {
          const notes: Note[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            
            // VALIDATION: Skip corrupted notes without valid local_id
            if (!row.local_id) {
              console.log('❌ Skipping note without local_id:', row);
              continue;
            }
            
            // BULLETPROOF NOTE CONSTRUCTION with dual ID system
            const note: Note = {
              local_id: row.local_id,                    // Primary identifier for local operations
              server_id: row.server_id || null,          // Server identifier for server operations
              title: row.title || '',                    // Ensure never null
              details: row.details || '',                // Ensure never null
              owner_id: row.owner_id || userId,          // Fallback to current user
              shared_with: DatabaseHelpers.parseJsonArray(row.shared_with) || [],
              bookmarked_by: DatabaseHelpers.parseJsonArray(row.bookmarked_by) || [],
              created_at: row.created_at || DatabaseHelpers.getCurrentTimestamp(),
              updated_at: row.updated_at || DatabaseHelpers.getCurrentTimestamp(),
            };
            
            notes.push(note);
          }
          resolve(notes);
        };

        db.transaction(tx => {
          if (userEmail) {
            // If email is provided, use it directly (exclude deleted notes)
            tx.executeSql(
              `SELECT * FROM notes 
               WHERE (owner_id = ? OR shared_with LIKE ?) 
               AND is_deleted = 0
               ORDER BY updated_at DESC`,
              [userId, `%"${userEmail}"%`],
              (_, result) => processNotesResult(result),
              (_, error) => {
                console.log('❌ Error fetching notes:', error);
                reject(error);
                return false;
              }
            );
          } else {
            // Get user email from user_session first
            tx.executeSql(
              'SELECT email FROM user_session WHERE user_id = ? LIMIT 1',
              [userId],
              (_, emailResult) => {
                let email = userId; // Fallback to userId if email not found
                if (emailResult.rows.length > 0) {
                  email = emailResult.rows.item(0).email;
                }
                
                // Now fetch notes with proper email search (exclude deleted notes)
                tx.executeSql(
                  `SELECT * FROM notes 
                   WHERE (owner_id = ? OR shared_with LIKE ?) 
                   AND is_deleted = 0
                   ORDER BY updated_at DESC`,
                  [userId, `%"${email}"%`],
                  (_, result) => processNotesResult(result),
                  (_, error) => {
                    console.log('❌ Error fetching notes:', error);
                    reject(error);
                    return false;
                  }
                );
              },
              (_, error) => {
                console.log('❌ Error fetching user email:', error);
                reject(error);
                return false;
              }
            );
          }
        });
      });
    });
  },

  /**
   * Create new note in local database (BULLETPROOF VERSION)
   * FIXED: Use local_id as primary ID until we have server ID
   */
  createNote: async (note: Partial<Note>, userId: string): Promise<string> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      const timestamp = DatabaseHelpers.getCurrentTimestamp();
      const localId = DatabaseHelpers.generateLocalId(); // Generate local ID for correlation
      
      // VALIDATION: Ensure required fields
      if (!userId) {
        throw new Error('User ID is required for note creation');
      }
      
      const safeTitle = (note.title || '').trim() || 'New Note';
      const safeDetails = (note.details || '').trim() || '';
      
      
      const result = await new Promise<string>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO notes (
              local_id, server_id, title, details, owner_id, shared_with, bookmarked_by,
              created_at, updated_at, sync_status, is_deleted, local_updated_at, needs_sync
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              localId, // Primary key - local ID for correlation
              null, // Server ID is null initially (will be updated when synced)
              safeTitle, // Validated title
              safeDetails, // Validated details  
              userId, // Validated user ID
              DatabaseHelpers.arrayToJson(note.shared_with || []),
              DatabaseHelpers.arrayToJson(note.bookmarked_by || []),
              timestamp,
              timestamp,
              SYNC_STATUS.PENDING,
              0, // is_deleted
              timestamp, // local_updated_at
              1 // needs_sync
            ],
            (_, result) => {
              resolve(localId);
            },
            (_, error) => {
              console.log('❌ Error creating note:', error);
              reject(error);
              return false;
            }
          );
        });
      });
      
      // RACE CONDITION FIX: Add delay AFTER transaction completes to ensure 
      // database commit is fully written to disk before next operation starts
      // Increased delay to 200ms for better reliability across all devices
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return result;
    });
  },

  /**
   * Update existing note in local database (BULLETPROOF VERSION)
   */
  updateNote: async (noteId: string, note: Partial<Note>, userId: string): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      const timestamp = DatabaseHelpers.getCurrentTimestamp();
      
      // VALIDATION: Ensure required fields
      if (!noteId) {
        throw new Error('Note ID is required for update');
      }
      if (!userId) {
        throw new Error('User ID is required for update');
      }
      
      const safeTitle = (note.title || '').trim() || 'Untitled Note';
      const safeDetails = (note.details || '').trim() || '';
      
      
      const updateOperation = async (retryCount: number = 0): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              `UPDATE notes SET 
               title = ?, 
               details = ?, 
               shared_with = ?, 
               bookmarked_by = ?, 
               updated_at = ?, 
               sync_status = ?, 
               local_updated_at = ?, 
               needs_sync = 1 
               WHERE local_id = ?`, // Always update by local_id
              [
                safeTitle,
                safeDetails,
                DatabaseHelpers.arrayToJson(note.shared_with || []),
                DatabaseHelpers.arrayToJson(note.bookmarked_by || []),
                timestamp,
                SYNC_STATUS.PENDING,
                timestamp,
                noteId // This should be local_id
              ],
              (_, result) => {
                if (result.rowsAffected > 0) {
                  resolve();
                } else {
                  // Note not found - could be a race condition with CREATE
                  if (retryCount < 3) {
                    console.warn(`⚠️ Note not found for update (attempt ${retryCount + 1}), retrying...`);
                    reject(new Error('RETRY_NEEDED'));
                  } else {
                    console.log('❌ Note not found for update after retries:', noteId);
                    reject(new Error(`Note with ID ${noteId} not found for update`));
                  }
                }
              },
              (_, error) => {
                console.log('❌ Error updating note:', error);
                reject(error);
                return false;
              }
            );
          });
        });
      };

      // Retry mechanism with increasing delays
      for (let attempt = 0; attempt <= 3; attempt++) {
        try {
          await updateOperation(attempt);
          
          // Add delay AFTER successful transaction to ensure commit
          await new Promise(resolve => setTimeout(resolve, 50));
          return;
        } catch (error: any) {
          if (error.message === 'RETRY_NEEDED' && attempt < 3) {
            // Wait longer with each retry to give CREATE operation time to complete
            // Increased delays: 200ms, 400ms, 600ms for better race condition handling
            await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
            continue;
          } else {
            throw error;
          }
        }
      }
    });
  },

  /**
   * Save note (CREATE OR UPDATE based on noteId presence) - BULLETPROOF VERSION
   */
  saveNote: async (note: Partial<Note>, userId: string): Promise<string> => {
    // Since updateNote and createNote are already queued, we need to queue this differently
    // to avoid double queuing. Instead, we'll determine the operation and call the appropriate method.
    if (note.local_id) {
      // Update existing note using local_id
      await notesSQLiteService.updateNote(note.local_id, note, userId);
      return note.local_id;
    } else {
      // Create new note
      return await notesSQLiteService.createNote(note, userId);
    }
  },

  /**
   * Soft delete note locally - marks as deleted but keeps data for sync
   */
  deleteNote: async (noteId: string): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      const timestamp = DatabaseHelpers.getCurrentTimestamp();
      
      const deleteOperation = async (retryCount: number = 0): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
          db.transaction(tx => {
            // Soft delete: mark as deleted and set sync needed (always use local_id)
            tx.executeSql(
              `UPDATE notes SET 
               is_deleted = 1, 
               sync_status = ?, 
               local_updated_at = ?, 
               needs_sync = 1,
               updated_at = ?
               WHERE local_id = ? AND is_deleted = 0`,
              [SYNC_STATUS.PENDING, timestamp, timestamp, noteId],
              (_, result) => {
                if (result.rowsAffected > 0) {
                  resolve();
                } else {
                  // Note not found - could be a race condition or already deleted
                  if (retryCount < 3) {
                    console.warn(`⚠️ Note not found for delete (attempt ${retryCount + 1}), retrying...`);
                    reject(new Error('RETRY_NEEDED'));
                  } else {
                    console.warn('⚠️ No note found to delete with ID:', noteId);
                    // Don't reject - deletion is idempotent
                    resolve();
                  }
                }
              },
              (_, error) => {
                console.log('❌ Error soft deleting note:', error);
                reject(error);
                return false;
              }
            );
          });
        });
      };

      // Retry mechanism with increasing delays
      for (let attempt = 0; attempt <= 3; attempt++) {
        try {
          await deleteOperation(attempt);
          
          // Add delay AFTER successful transaction to ensure commit
          await new Promise(resolve => setTimeout(resolve, 50));
          return;
        } catch (error: any) {
          if (error.message === 'RETRY_NEEDED' && attempt < 3) {
            // Wait longer with each retry to give CREATE operation time to complete
            // Increased delays: 200ms, 400ms, 600ms for better race condition handling
            await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
            continue;
          } else {
            throw error;
          }
        }
      }
    });
  },

  /**
   * Permanently delete note after successful sync to server
   */
  permanentlyDeleteNote: async (noteId: string): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Hard delete the note record after successful server sync
          tx.executeSql(
            `DELETE FROM notes WHERE local_id = ? AND is_deleted = 1`,
            [noteId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Note permanently deleted after successful sync
              } else {
                console.warn('⚠️ No soft-deleted note found to permanently delete with ID:', noteId);
              }
              resolve();
            },
            (_, error) => {
              console.log('❌ Error permanently deleting note:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Update note sync status after successful API call
   */
  markNoteSynced: async (noteId: string, serverData?: Partial<Note>): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        const updateSql = serverData 
          ? `UPDATE notes SET 
             sync_status = ?, 
             needs_sync = 0, 
             local_updated_at = NULL,
             title = COALESCE(?, title),
             details = COALESCE(?, details),
             updated_at = COALESCE(?, updated_at)
             WHERE local_id = ?`
          : `UPDATE notes SET 
             sync_status = ?, 
             needs_sync = 0, 
             local_updated_at = NULL 
             WHERE local_id = ?`;
             
        const params = serverData 
          ? [SYNC_STATUS.SYNCED, serverData.title, serverData.details, serverData.updated_at, noteId]
          : [SYNC_STATUS.SYNCED, noteId];
        
        db.transaction(tx => {
          tx.executeSql(
            updateSql,
            params,
            (_, result) => {
              resolve();
            },
            (_, error) => {
              console.log('Error marking note as synced:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Get notes that need to be synced
   */
  getNotesNeedingSync: async (): Promise<LocalNote[]> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM notes WHERE needs_sync = 1 ORDER BY local_updated_at ASC`,
            [],
            (_, result) => {
              const notes: LocalNote[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                notes.push({
                  local_id: row.local_id,
                  server_id: row.server_id,
                  title: row.title,
                  details: row.details,
                  owner_id: row.owner_id,
                  shared_with: DatabaseHelpers.parseJsonArray(row.shared_with),
                  bookmarked_by: DatabaseHelpers.parseJsonArray(row.bookmarked_by),
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  sync_status: row.sync_status,
                  is_deleted: row.is_deleted,
                  local_updated_at: row.local_updated_at,
                  needs_sync: row.needs_sync,
                });
              }
              resolve(notes);
            },
            (_, error) => {
              console.log('Error fetching notes needing sync:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Update server_id by local_id (for mapping after sync)
   */
  updateServerIdByLocalId: async (localId: string, serverId: string): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `UPDATE notes SET server_id = ? WHERE local_id = ?`,
            [serverId, localId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                console.log(`✅ Updated server_id ${serverId} for local_id ${localId}`);
              } else {
                console.warn(`⚠️ No note found with local_id ${localId} to update`);
              }
              resolve();
            },
            (_, error) => {
              console.log('❌ Error updating server_id:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Get server_id by local_id (for sync operations)
   */
  getServerIdByLocalId: async (localId: string): Promise<string | null> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT server_id FROM notes WHERE local_id = ? AND server_id IS NOT NULL',
            [localId],
            (_, result) => {
              if (result.rows.length > 0) {
                resolve(result.rows.item(0).server_id);
              } else {
                resolve(null); // No server_id found
              }
            },
            (_, error) => {
              console.log('❌ Error getting server_id:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Get local_id by server_id (for reverse lookup)
   */
  getLocalIdByServerId: async (serverId: string): Promise<string | null> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT local_id FROM notes WHERE server_id = ?',
            [serverId],
            (_, result) => {
              if (result.rows.length > 0) {
                resolve(result.rows.item(0).local_id);
              } else {
                resolve(null); // No local_id found
              }
            },
            (_, error) => {
              console.log('❌ Error getting local_id:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Save server note (with server ID) - can overwrite existing
   */
  saveServerNote: async (serverNote: Note): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO notes (
              local_id, server_id, title, details, owner_id, shared_with, bookmarked_by,
              created_at, updated_at, sync_status, is_deleted, local_updated_at, needs_sync
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              serverNote.local_id, // Local ID (primary key)
              serverNote.server_id || null, // Server ID 
              serverNote.title,
              serverNote.details,
              serverNote.owner_id,
              DatabaseHelpers.arrayToJson(serverNote.shared_with || []),
              DatabaseHelpers.arrayToJson(serverNote.bookmarked_by || []),
              serverNote.created_at,
              serverNote.updated_at,
              SYNC_STATUS.SYNCED, // Already synced
              0, // is_deleted
              null, // local_updated_at
              0 // needs_sync
            ],
            (_, result) => {
              resolve();
            },
            (_, error) => {
              console.log('❌ Error saving server note:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Update local ID to server ID after successful sync
   * NEW FUNCTION: Maps local ID to server ID after creation
   */
  updateLocalIdToServerId: async (localId: string, serverId: string): Promise<void> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `UPDATE notes SET 
             server_id = ?, 
             sync_status = ?, 
             needs_sync = 0, 
             local_updated_at = NULL 
             WHERE local_id = ?`,
            [serverId, SYNC_STATUS.SYNCED, localId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                resolve();
              } else {
                console.log(`❌ No note found with local ID ${localId} for server ID update`);
                reject(new Error(`No note found with local ID ${localId}`));
              }
            },
            (_, error) => {
              console.log('❌ Error updating local ID to server ID:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Get soft-deleted notes that need to be permanently deleted after sync
   */
  getSoftDeletedNotes: async (): Promise<LocalNote[]> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM notes WHERE is_deleted = 1 ORDER BY updated_at ASC`,
            [],
            (_, result) => {
              const notes: LocalNote[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                notes.push({
                  local_id: row.local_id,
                  server_id: row.server_id,
                  title: row.title,
                  details: row.details,
                  owner_id: row.owner_id,
                  shared_with: DatabaseHelpers.parseJsonArray(row.shared_with),
                  bookmarked_by: DatabaseHelpers.parseJsonArray(row.bookmarked_by),
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  sync_status: row.sync_status,
                  is_deleted: row.is_deleted,
                  local_updated_at: row.local_updated_at,
                  needs_sync: row.needs_sync,
                });
              }
              resolve(notes);
            },
            (_, error) => {
              console.log('Error fetching soft-deleted notes:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * Get notes that have local IDs (pending server creation)
   * NEW FUNCTION: For debugging and management of pending creations
   */
  getNotesWithLocalIds: async (): Promise<LocalNote[]> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM notes WHERE local_id IS NOT NULL ORDER BY created_at ASC`,
            [],
            (_, result) => {
              const notes: LocalNote[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                notes.push({
                  local_id: row.local_id,
                  server_id: row.server_id,
                  title: row.title,
                  details: row.details,
                  owner_id: row.owner_id,
                  shared_with: DatabaseHelpers.parseJsonArray(row.shared_with),
                  bookmarked_by: DatabaseHelpers.parseJsonArray(row.bookmarked_by),
                  created_at: row.created_at,
                  updated_at: row.updated_at,
                  sync_status: row.sync_status,
                  is_deleted: row.is_deleted,
                  local_updated_at: row.local_updated_at,
                  needs_sync: row.needs_sync,
                });
              }
              resolve(notes);
            },
            (_, error) => {
              console.log('Error fetching notes with local IDs:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * CLEANUP FUNCTION: Remove corrupted notes that break FlashList
   * Call this on app startup to ensure clean data
   */
  cleanupCorruptedNotes: async (userId: string): Promise<{ cleaned: number; total: number }> => {
    return dbQueue.add(async () => {
      const db = DatabaseInit.getInstance().getDatabase();
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          // First, count total notes
          tx.executeSql(
            `SELECT COUNT(*) as total FROM notes WHERE owner_id = ?`,
            [userId],
            (_, countResult) => {
              const totalNotes = countResult.rows.item(0).total;
              
              // Delete notes with invalid data that would break FlashList
              tx.executeSql(
                `DELETE FROM notes WHERE 
                 owner_id = ? AND (
                   local_id IS NULL OR                 -- No valid local_id (primary key)
                   title IS NULL OR                    -- Null title
                   details IS NULL OR                  -- Null details
                   owner_id IS NULL OR                 -- Null owner
                   created_at IS NULL OR               -- Null created_at
                   updated_at IS NULL                  -- Null updated_at
                 )`,
                [userId],
                (_, deleteResult) => {
                  const cleanedCount = deleteResult.rowsAffected || 0;
                  
                  resolve({
                    cleaned: cleanedCount,
                    total: totalNotes
                  });
                },
                (_, error) => {
                  console.log('❌ Error during cleanup:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (_, error) => {
              console.log('❌ Error counting notes for cleanup:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    });
  },

  /**
   * VALIDATION FUNCTION: Check if note data is valid for FlashList
   */
  validateNoteForUI: (note: any): boolean => {
    if (!note) return false;
    if (!note.local_id) return false; // Only local_id is required (primary identifier)
    if (typeof note.title !== 'string') return false;
    if (typeof note.details !== 'string') return false;
    if (!note.owner_id) return false;
    if (!note.created_at) return false;
    if (!note.updated_at) return false;
    return true;
  },
}; 