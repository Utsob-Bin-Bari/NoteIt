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
 * SQLite operations for notes data
 * 
 * NOTE: This service uses HARD DELETE for better performance with large datasets.
 * When a note is deleted, it's permanently removed from the local database to prevent bloat.
 * The sync queue handles server synchronization separately.
 */
export const notesSQLiteService = {
  /**
   * Fetch all notes for current user (with bulletproof ID handling)
   * FIXED: Use local_id as primary id when server id is null
   */
  fetchAllNotes: async (userId: string): Promise<Note[]> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM notes 
           WHERE (owner_id = ? OR shared_with LIKE ?) 
           ORDER BY updated_at DESC`,
          [userId, `%"${userId}"%`],
          (_, result) => {
            const notes: Note[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              
              // BULLETPROOF ID HANDLING: Use local_id if server id is null
              const primaryId = row.id || row.local_id;
              
              // VALIDATION: Skip corrupted notes without valid ID
              if (!primaryId) {
                console.warn('⚠️ Skipping note without valid ID:', row);
                continue;
              }
              
              // BULLETPROOF NOTE CONSTRUCTION
              const note: Note = {
                id: primaryId, // Use server ID or local ID as primary
                local_id: row.local_id || null,
                title: row.title || '', // Ensure never null
                details: row.details || '', // Ensure never null
                owner_id: row.owner_id || userId, // Fallback to current user
                shared_with: DatabaseHelpers.parseJsonArray(row.shared_with) || [],
                bookmarked_by: DatabaseHelpers.parseJsonArray(row.bookmarked_by) || [],
                created_at: row.created_at || DatabaseHelpers.getCurrentTimestamp(),
                updated_at: row.updated_at || DatabaseHelpers.getCurrentTimestamp(),
              };
              
              notes.push(note);
            }
            resolve(notes);
          },
          (_, error) => {
            console.error('❌ Error fetching notes:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Create new note in local database (BULLETPROOF VERSION)
   * FIXED: Use local_id as primary ID until we have server ID
   */
  createNote: async (note: Partial<Note>, userId: string): Promise<string> => {
    const db = DatabaseInit.getInstance().getDatabase();
    const timestamp = DatabaseHelpers.getCurrentTimestamp();
    const localId = DatabaseHelpers.generateLocalId(); // Generate local ID for correlation
    
    // VALIDATION: Ensure required fields
    if (!userId) {
      throw new Error('User ID is required for note creation');
    }
    
    const safeTitle = (note.title || '').trim() || 'New Note';
    const safeDetails = (note.details || '').trim() || '';
    
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO notes (
            id, local_id, title, details, owner_id, shared_with, bookmarked_by,
            created_at, updated_at, sync_status, is_deleted, local_updated_at, needs_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            null, // Server ID is null initially (will be updated when synced)
            localId, // Store local ID for correlation
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
            console.error('❌ Error creating note:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Update existing note in local database (BULLETPROOF VERSION)
   */
  updateNote: async (noteId: string, note: Partial<Note>, userId: string): Promise<void> => {
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
    
    
    return new Promise((resolve, reject) => {
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
           WHERE (id = ? OR local_id = ?)`, // Support both server ID and local ID
          [
            safeTitle,
            safeDetails,
            DatabaseHelpers.arrayToJson(note.shared_with || []),
            DatabaseHelpers.arrayToJson(note.bookmarked_by || []),
            timestamp,
            SYNC_STATUS.PENDING,
            timestamp,
            noteId,
            noteId // Check both id and local_id columns
          ],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              console.error('❌ Note not found for update:', noteId);
              reject(new Error(`Note with ID ${noteId} not found for update`));
            }
          },
          (_, error) => {
            console.error('❌ Error updating note:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Save note (CREATE OR UPDATE based on noteId presence) - BULLETPROOF VERSION
   */
  saveNote: async (note: Partial<Note>, userId: string): Promise<string> => {
    if (note.id) {
      // Update existing note
      await notesSQLiteService.updateNote(note.id, note, userId);
      return note.id;
    } else {
      // Create new note
      return await notesSQLiteService.createNote(note, userId);
    }
  },

  /**
   * Hard delete note locally to prevent database bloat
   */
  deleteNote: async (noteId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Hard delete the note record (support both server ID and local ID)
        // Note: Bookmarks are stored in the notes table as JSON, so no separate cleanup needed
        tx.executeSql(
          `DELETE FROM notes WHERE id = ? OR local_id = ?`,
          [noteId, noteId],
          (_, result) => {
            if (result.rowsAffected > 0) {
            } else {
              console.warn('⚠️ No note found to delete with ID:', noteId);
            }
            resolve();
          },
          (_, error) => {
            console.error('❌ Error hard deleting note:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Update note sync status after successful API call
   */
  markNoteSynced: async (noteId: string, serverData?: Partial<Note>): Promise<void> => {
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
           WHERE id = ?`
        : `UPDATE notes SET 
           sync_status = ?, 
           needs_sync = 0, 
           local_updated_at = NULL 
           WHERE id = ?`;
           
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
            console.error('Error marking note as synced:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Get notes that need to be synced
   */
  getNotesNeedingSync: async (): Promise<LocalNote[]> => {
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
                id: row.id,
                local_id: row.local_id,
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
            console.error('Error fetching notes needing sync:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Update note ID to match server ID (prevents duplicates)
   */
  updateNoteId: async (oldId: string, newId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE notes SET id = ? WHERE id = ?`,
          [newId, oldId],
          (_, result) => {
            if (result.rowsAffected > 0) {
            } else {
              console.warn(`⚠️ No note found with ID ${oldId} to update`);
            }
            resolve();
          },
          (_, error) => {
            console.error('Error updating note ID:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Save server note (with server ID) - can overwrite existing
   */
  saveServerNote: async (serverNote: Note): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO notes (
            id, local_id, title, details, owner_id, shared_with, bookmarked_by,
            created_at, updated_at, sync_status, is_deleted, local_updated_at, needs_sync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            serverNote.id, // Server ID
            serverNote.local_id || null, // Local ID (optional)
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
            console.error('❌ Error saving server note:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Update local ID to server ID after successful sync
   * NEW FUNCTION: Maps local ID to server ID after creation
   */
  updateLocalIdToServerId: async (localId: string, serverId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE notes SET 
           id = ?, 
           local_id = NULL,
           sync_status = ?, 
           needs_sync = 0, 
           local_updated_at = NULL 
           WHERE local_id = ?`,
          [serverId, SYNC_STATUS.SYNCED, localId],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              console.error(`❌ No note found with local ID ${localId} for server ID update`);
              reject(new Error(`No note found with local ID ${localId}`));
            }
          },
          (_, error) => {
            console.error('❌ Error updating local ID to server ID:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Get notes that have local IDs (pending server creation)
   * NEW FUNCTION: For debugging and management of pending creations
   */
  getNotesWithLocalIds: async (): Promise<LocalNote[]> => {
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
                id: row.id,
                local_id: row.local_id,
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
            console.error('Error fetching notes with local IDs:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * CLEANUP FUNCTION: Remove corrupted notes that break FlashList
   * Call this on app startup to ensure clean data
   */
  cleanupCorruptedNotes: async (userId: string): Promise<{ cleaned: number; total: number }> => {
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
                 id IS NULL AND local_id IS NULL OR  -- No valid ID
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
                console.error('❌ Error during cleanup:', error);
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            console.error('❌ Error counting notes for cleanup:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * VALIDATION FUNCTION: Check if note data is valid for FlashList
   */
  validateNoteForUI: (note: any): boolean => {
    if (!note) return false;
    if (!note.id && !note.local_id) return false;
    if (typeof note.title !== 'string') return false;
    if (typeof note.details !== 'string') return false;
    if (!note.owner_id) return false;
    if (!note.created_at) return false;
    if (!note.updated_at) return false;
    return true;
  },
}; 