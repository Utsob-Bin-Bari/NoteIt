import { DatabaseInit } from '../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers } from '../../infrastructure/storage/DatabaseSchema';
import { fetchAllNotes } from '../../infrastructure/api/requests/notes/fetchAllNotes';
import { getUserData } from '../../infrastructure/api/requests/user/userData';
import { fetchAllBookmarkedNotes } from '../../infrastructure/api/requests/bookmarks/fetchAllBookmarkedNotes';
import { getUserSharedNotes } from '../../infrastructure/api/requests/user/userSharedNotes';

interface RecoveryResult {
  success: boolean;
  recovered: {
    ownNotes: number;
    sharedNotes: number;
    bookmarkedNotes: number;
    userData: boolean;
  };
  error?: string;
}

interface RecoveryDetection {
  needsRecovery: boolean;
  reason: string;
  canRecover: boolean;
}

export const RecoveryService = {
  /**
   * Detect if recovery is needed
   */
  detectRecoveryNeed: async (accessToken?: string): Promise<RecoveryDetection> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();

      // Check if database is healthy
      const isHealthy = await dbInit.checkDatabaseHealth();
      if (!isHealthy) {
        return {
          needsRecovery: true,
          reason: 'Database corruption detected',
          canRecover: !!accessToken
        };
      }

      // Check if user has session but no data (hard delete means all existing notes are valid)
      const [notesResult] = await db.executeSql('SELECT COUNT(*) as count FROM notes');
      const notesCount = notesResult.rows.item(0).count;

      if (accessToken && notesCount === 0) {
        // User is logged in but has no local data - might need recovery
        return {
          needsRecovery: true,
          reason: 'No local data found for authenticated user',
          canRecover: true
        };
      }

      return {
        needsRecovery: false,
        reason: 'Local data exists or user not authenticated',
        canRecover: false
      };
    } catch (error) {
      return {
        needsRecovery: true,
        reason: `Detection failed: ${error}`,
        canRecover: !!accessToken
      };
    }
  },

  /**
   * Check if backend has data for recovery
   */
  checkBackendDataExists: async (accessToken: string): Promise<boolean> => {
    try {
      // Check for any type of data on backend
      const [ownNotes, sharedNotes, bookmarkedNotes] = await Promise.allSettled([
        fetchAllNotes({ accessToken }),
        getUserSharedNotes({ accessToken }),
        fetchAllBookmarkedNotes({ accessToken })
      ]);
      
      const hasOwnNotes = ownNotes.status === 'fulfilled' && ownNotes.value.notes?.length > 0;
      const hasSharedNotes = sharedNotes.status === 'fulfilled' && sharedNotes.value.notes?.length > 0;
      const hasBookmarkedNotes = bookmarkedNotes.status === 'fulfilled' && bookmarkedNotes.value.notes?.length > 0;
      
      return hasOwnNotes || hasSharedNotes || hasBookmarkedNotes;
    } catch (error) {
      return false;
    }
  },

  /**
   * Perform full recovery from backend server (NOT local database)
   * This fetches fresh data from the internet/backend and overwrites local storage
   */
  performRecovery: async (accessToken: string): Promise<RecoveryResult> => {
    const result: RecoveryResult = {
      success: false,
      recovered: {
        ownNotes: 0,
        sharedNotes: 0,
        bookmarkedNotes: 0,
        userData: false
      }
    };

    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      const currentTime = DatabaseHelpers.getCurrentTimestamp();


      // Step 1: Fetch user data from BACKEND SERVER
      try {
        const userData = await getUserData({ accessToken });
        if (userData.user) {
          // Update local user session if needed
          await db.executeSql(
            `UPDATE user_session SET updated_at = ?, last_sync_at = ? WHERE id = 1`,
            [currentTime, currentTime]
          );
          result.recovered.userData = true;
        }
      } catch (error) {
      }

      // Step 2: Fetch user's own notes from BACKEND SERVER
      const backendNotes = await fetchAllNotes({ accessToken });
      
      if (backendNotes.notes && backendNotes.notes.length > 0) {
        for (const note of backendNotes.notes) {
          await db.executeSql(
            `INSERT OR REPLACE INTO notes 
             (id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
            [
              note.id, note.title, note.details, note.owner_id,
              JSON.stringify(note.shared_with || []),
              JSON.stringify(note.bookmarked_by || []),
              note.created_at, note.updated_at
            ]
          );
          result.recovered.ownNotes++;
        }
      } else {
      }

      // Step 3: Fetch shared notes from BACKEND SERVER
      try {
        const sharedNotes = await getUserSharedNotes({ accessToken });
        
        if (sharedNotes.notes && sharedNotes.notes.length > 0) {
          for (const note of sharedNotes.notes) {
            await db.executeSql(
              `INSERT OR REPLACE INTO notes 
               (id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
              [
                note.id, note.title, note.details, note.owner_id,
                JSON.stringify(note.shared_with || []),
                JSON.stringify(note.bookmarked_by || []),
                note.created_at, note.updated_at
              ]
            );
            result.recovered.sharedNotes++;
          }
        } else {
        }
      } catch (error) {
      }

      // Step 4: Fetch bookmarked notes from BACKEND SERVER
      try {
        const bookmarkedNotes = await fetchAllBookmarkedNotes({ accessToken });
        
        if (bookmarkedNotes.notes && bookmarkedNotes.notes.length > 0) {
          for (const note of bookmarkedNotes.notes) {
            await db.executeSql(
              `INSERT OR REPLACE INTO notes 
               (id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
              [
                note.id, note.title, note.details, note.owner_id,
                JSON.stringify(note.shared_with || []),
                JSON.stringify(note.bookmarked_by || []),
                note.created_at, note.updated_at
              ]
            );
            result.recovered.bookmarkedNotes++;
          }
        } else {
        }
      } catch (error) {
      }

      // Step 5: Update sync metadata
      await db.executeSql(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES 
         ('last_full_sync', ?, ?),
         ('recovery_completed_at', ?, ?)`,
        [currentTime, currentTime, currentTime, currentTime]
      );

      result.success = true;
      const totalNotes = result.recovered.ownNotes + result.recovered.sharedNotes + result.recovered.bookmarkedNotes;
      
    } catch (error) {
      result.error = `Recovery from BACKEND SERVER failed: ${error}`;
    }

    return result;
  },

  /**
   * Clear corrupted data before recovery
   */
  clearCorruptedData: async (): Promise<boolean> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();

      // Clear all user data except session
      await db.executeSql('DELETE FROM notes');
      await db.executeSql('DELETE FROM users WHERE id != (SELECT user_id FROM user_session WHERE id = 1)');
      await db.executeSql('DELETE FROM sync_queue');
      
      return true;
    } catch (error) {
      return false;
    }
  }
}; 