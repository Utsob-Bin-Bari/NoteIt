import { DatabaseInit } from '../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers } from '../../infrastructure/storage/DatabaseSchema';
import { fetchAllNotes } from '../../infrastructure/api/requests/notes/fetchAllNotes';
import { getUserData } from '../../infrastructure/api/requests/user/userData';
import { fetchAllBookmarkedNotes } from '../../infrastructure/api/requests/bookmarks/fetchAllBookmarkedNotes';
import { getUserSharedNotes } from '../../infrastructure/api/requests/user/userSharedNotes';
import { fetchAllSharedUsers } from '../../infrastructure/api/requests/notes/fetchAllSharedUsers';

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
   * Convert user IDs to emails using the shared users API
   */
  convertUserIdsToEmails: async (noteId: string, userIds: string[], accessToken: string): Promise<string[]> => {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Fetch shared users for this note to get email mappings
      const sharedUsersResponse = await fetchAllSharedUsers({ noteId, accessToken });
      
      if (!sharedUsersResponse.users || sharedUsersResponse.users.length === 0) {
        return [];
      }

      // Create a mapping of user ID to email
      const userIdToEmailMap = new Map<string, string>();
      sharedUsersResponse.users.forEach(user => {
        userIdToEmailMap.set(user.id, user.email);
      });

      // Convert user IDs to emails
      const emails = userIds
        .map(userId => userIdToEmailMap.get(userId))
        .filter((email): email is string => !!email); // Remove undefined values

      return emails;
    } catch (error) {
      console.log(`Failed to convert user IDs to emails for note ${noteId}:`, error);
      return []; // Return empty array on error
    }
  },

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
        console.log('User data recovery failed:', error);
        // Continue with other recovery steps even if user data fails
      }

      // Step 2: Fetch user's own notes from BACKEND SERVER
      try {
        const backendNotes = await fetchAllNotes({ accessToken });
        
        if (backendNotes.notes && backendNotes.notes.length > 0) {
          for (const note of backendNotes.notes) {
            try {
              // Convert shared_with user IDs to emails before storing
              let sharedWithEmails: string[] = [];
              if (note.shared_with && note.shared_with.length > 0) {
                sharedWithEmails = await RecoveryService.convertUserIdsToEmails(
                  note.id, 
                  note.shared_with, 
                  accessToken
                );
              }

              await db.executeSql(
                `INSERT OR REPLACE INTO notes 
                 (local_id, server_id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
                [
                  `recovery_${note.id}`, // Generate local_id for recovery
                  note.id, // Store as server_id
                  note.title, note.details, note.owner_id,
                  JSON.stringify(sharedWithEmails), // Store emails instead of user IDs
                  JSON.stringify(note.bookmarked_by || []),
                  note.created_at, note.updated_at
                ]
              );
              result.recovered.ownNotes++;
            } catch (noteError) {
              console.log(`Failed to recover own note ${note.id}:`, noteError);
            }
          }
        }
      } catch (error) {
        console.log('Own notes recovery failed:', error);
      }

      // Step 3: Fetch shared notes from BACKEND SERVER
      try {
        const sharedNotes = await getUserSharedNotes({ accessToken });
        
        if (sharedNotes.notes && sharedNotes.notes.length > 0) {
          for (const note of sharedNotes.notes) {
            try {
              // Convert shared_with user IDs to emails before storing
              let sharedWithEmails: string[] = [];
              if (note.shared_with && note.shared_with.length > 0) {
                sharedWithEmails = await RecoveryService.convertUserIdsToEmails(
                  note.id, 
                  note.shared_with, 
                  accessToken
                );
              }

              await db.executeSql(
                `INSERT OR REPLACE INTO notes 
                 (local_id, server_id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
                [
                  `recovery_shared_${note.id}`, // Generate local_id for recovery
                  note.id, // Store as server_id
                  note.title, note.details, note.owner_id,
                  JSON.stringify(sharedWithEmails), // Store emails instead of user IDs
                  JSON.stringify(note.bookmarked_by || []),
                  note.created_at, note.updated_at
                ]
              );
              result.recovered.sharedNotes++;
            } catch (noteError) {
              console.log(`Failed to recover shared note ${note.id}:`, noteError);
            }
          }
        }
      } catch (error) {
        console.log('Shared notes recovery failed:', error);
      }

      // Step 4: Fetch bookmarked notes from BACKEND SERVER
      try {
        const bookmarkedNotes = await fetchAllBookmarkedNotes({ accessToken });
        
        if (bookmarkedNotes.notes && bookmarkedNotes.notes.length > 0) {
          for (const note of bookmarkedNotes.notes) {
            try {
              // Convert shared_with user IDs to emails before storing
              let sharedWithEmails: string[] = [];
              if (note.shared_with && note.shared_with.length > 0) {
                sharedWithEmails = await RecoveryService.convertUserIdsToEmails(
                  note.id, 
                  note.shared_with, 
                  accessToken
                );
              }

              await db.executeSql(
                `INSERT OR REPLACE INTO notes 
                 (local_id, server_id, title, details, owner_id, shared_with, bookmarked_by, created_at, updated_at, sync_status, is_deleted, needs_sync) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 0, 0)`,
                [
                  `recovery_bookmarked_${note.id}`, // Generate local_id for recovery
                  note.id, // Store as server_id
                  note.title, note.details, note.owner_id,
                  JSON.stringify(sharedWithEmails), // Store emails instead of user IDs
                  JSON.stringify(note.bookmarked_by || []),
                  note.created_at, note.updated_at
                ]
              );
              result.recovered.bookmarkedNotes++;
            } catch (noteError) {
              console.log(`Failed to recover bookmarked note ${note.id}:`, noteError);
            }
          }
        }
      } catch (error) {
        console.log('Bookmarked notes recovery failed:', error);
      }

      // Step 5: Update sync metadata
      try {
        await db.executeSql(
          `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES 
           ('last_full_sync', ?, ?),
           ('recovery_completed_at', ?, ?)`,
          [currentTime, currentTime, currentTime, currentTime]
        );
      } catch (error) {
        console.log('Failed to update sync metadata:', error);
      }

      result.success = true;
      const totalNotes = result.recovered.ownNotes + result.recovered.sharedNotes + result.recovered.bookmarkedNotes;
      

      
    } catch (error) {
      console.log('Recovery error:', error);
      if (error instanceof Error) {
        result.error = `Recovery from BACKEND SERVER failed: ${error.message}`;
      } else {
        result.error = `Recovery from BACKEND SERVER failed: ${String(error)}`;
      }
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