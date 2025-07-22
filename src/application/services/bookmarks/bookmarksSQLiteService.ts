import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers, SYNC_STATUS } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';

/**
 * SQLite operations for bookmark data
 */
export const bookmarksSQLiteService = {
  /**
   * Fetch all bookmarked notes for current user (hard delete means no deleted records exist)
   */
  fetchBookmarkedNotes: async (userId: string): Promise<Note[]> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM notes 
           WHERE bookmarked_by LIKE ? 
           ORDER BY updated_at DESC`,
          [`%"${userId}"%`],
          (_, result) => {
            const notes: Note[] = [];
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
              });
            }
            resolve(notes);
          },
          (_, error) => {
            console.error('Error fetching bookmarked notes:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Add bookmark to note locally (SUPPORTS BOTH SERVER AND LOCAL IDs)
   * Always performs update to support tracking every bookmark operation
   */
  addBookmark: async (noteId: string, userId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    const timestamp = DatabaseHelpers.getCurrentTimestamp();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // First get current bookmarked_by array (SUPPORT BOTH ID TYPES)
        tx.executeSql(
          `SELECT bookmarked_by FROM notes WHERE id = ? OR local_id = ?`,
          [noteId, noteId],
          (_, result) => {
            if (result.rows.length === 0) {
              reject(new Error('Note not found'));
              return;
            }
            
            const row = result.rows.item(0);
            const currentBookmarks = DatabaseHelpers.parseJsonArray(row.bookmarked_by);
            
            // ALWAYS ADD TO SYNC QUEUE: Add user if not already bookmarked
            if (!currentBookmarks.includes(userId)) {
              currentBookmarks.push(userId);
            }
            // If already bookmarked, we still perform the update to support tracking
            
            // Update the note with bookmark data (SUPPORT BOTH ID TYPES)
            tx.executeSql(
              `UPDATE notes SET 
               bookmarked_by = ?, 
               sync_status = ?, 
               local_updated_at = ?, 
               needs_sync = 1 
               WHERE id = ? OR local_id = ?`,
              [
                DatabaseHelpers.arrayToJson(currentBookmarks),
                SYNC_STATUS.PENDING,
                timestamp,
                noteId,
                noteId
              ],
              (_, result) => {
                resolve(); // Always resolve - supports redundant operations
              },
              (_, error) => {
                console.error('Error adding bookmark:', error);
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            console.error('Error fetching note for bookmark:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Remove bookmark from note locally (SUPPORTS BOTH SERVER AND LOCAL IDs)
   * Always performs update to support tracking every unbookmark operation
   */
  removeBookmark: async (noteId: string, userId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    const timestamp = DatabaseHelpers.getCurrentTimestamp();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // First get current bookmarked_by array (SUPPORT BOTH ID TYPES)
        tx.executeSql(
          `SELECT bookmarked_by FROM notes WHERE id = ? OR local_id = ?`,
          [noteId, noteId],
          (_, result) => {
            if (result.rows.length === 0) {
              reject(new Error('Note not found'));
              return;
            }
            
            const row = result.rows.item(0);
            const currentBookmarks = DatabaseHelpers.parseJsonArray(row.bookmarked_by);
            
            // ALWAYS ADD TO SYNC QUEUE: Remove user from bookmarks
            const updatedBookmarks = currentBookmarks.filter(id => id !== userId);
            // Even if user wasn't bookmarked, we still perform the update to support tracking
            
            // Update the note with updated bookmarks (SUPPORT BOTH ID TYPES)
            tx.executeSql(
              `UPDATE notes SET 
               bookmarked_by = ?, 
               sync_status = ?, 
               local_updated_at = ?, 
               needs_sync = 1 
               WHERE id = ? OR local_id = ?`,
              [
                DatabaseHelpers.arrayToJson(updatedBookmarks),
                SYNC_STATUS.PENDING,
                timestamp,
                noteId,
                noteId
              ],
              (_, result) => {
                resolve(); // Always resolve - supports redundant operations
              },
              (_, error) => {
                console.error('Error removing bookmark:', error);
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            console.error('Error fetching note for unbookmark:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Check if note is bookmarked by user (SUPPORTS BOTH SERVER AND LOCAL IDs)
   */
  isNoteBookmarked: async (noteId: string, userId: string): Promise<boolean> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT bookmarked_by FROM notes WHERE id = ? OR local_id = ?`,
          [noteId, noteId],
          (_, result) => {
            if (result.rows.length === 0) {
              resolve(false);
              return;
            }
            
            const row = result.rows.item(0);
            const bookmarkedBy = DatabaseHelpers.parseJsonArray(row.bookmarked_by);
            resolve(bookmarkedBy.includes(userId));
          },
          (_, error) => {
            console.error('Error checking bookmark status:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Update bookmark sync status after successful API call (SUPPORTS BOTH SERVER AND LOCAL IDs)
   */
  markBookmarkSynced: async (noteId: string): Promise<void> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE notes SET 
           sync_status = ?, 
           needs_sync = 0, 
           local_updated_at = NULL 
           WHERE id = ? OR local_id = ?`,
          [SYNC_STATUS.SYNCED, noteId, noteId],
          (_, result) => {
            resolve();
          },
          (_, error) => {
            console.error('Error marking bookmark as synced:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Get bookmark operations that need to be synced
   */
  getBookmarkOperationsNeedingSync: async (userId: string): Promise<{noteId: string, operation: 'add' | 'remove', bookmarkedBy: string[]}[]> => {
    const db = DatabaseInit.getInstance().getDatabase();
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT id, bookmarked_by FROM notes WHERE needs_sync = 1`,
          [],
          (_, result) => {
            const operations: {noteId: string, operation: 'add' | 'remove', bookmarkedBy: string[]}[] = [];
            
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              const bookmarkedBy = DatabaseHelpers.parseJsonArray(row.bookmarked_by);
              
              // Check if this affects the current user's bookmarks
              const isCurrentlyBookmarked = bookmarkedBy.includes(userId);
              
              // We need to determine if this is an add or remove operation
              // For simplicity, we'll treat this as the current state
              operations.push({
                noteId: row.id,
                operation: isCurrentlyBookmarked ? 'add' : 'remove',
                bookmarkedBy
              });
            }
            
            resolve(operations);
          },
          (_, error) => {
            console.error('Error fetching bookmark operations needing sync:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },
}; 