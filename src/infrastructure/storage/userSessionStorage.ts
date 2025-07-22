import { DatabaseInit } from './DatabaseInit';
import { DatabaseHelpers } from './DatabaseSchema';

/**
 * Infrastructure layer: SQLite operations for user sessions
 */
export const userSessionStorage = {
  /**
   * Store user session data in SQLite
   */
  store: async (userData: {
    id: string;
    email: string;
    name: string;
    accessToken: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      const currentTime = DatabaseHelpers.getCurrentTimestamp();
      
      await db.executeSql(
        `INSERT OR REPLACE INTO user_session 
         (id, user_id, email, name, access_token, created_at, updated_at) 
         VALUES (1, ?, ?, ?, ?, ?, ?)`,
        [userData.id, userData.email, userData.name, userData.accessToken, currentTime, currentTime]
      );

      return { success: true };
    } catch (error: any) {
      
      let errorMessage = 'Failed to store user session locally';
      if (error.message) {
        errorMessage = `Failed to store user session: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Clear user session from SQLite
   */
  clear: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      
      // Clear user session table completely
      await db.executeSql('DELETE FROM user_session');
      
      // Clear any user-related sync queue items (thorough cleanup)
      await db.executeSql('DELETE FROM sync_queue WHERE entity_type = ?', ['user']);
      
      return { success: true };
    } catch (error: any) {
      
      let errorMessage = 'Failed to clear user session locally';
      if (error.message) {
        errorMessage = `Failed to clear user session: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Get existing user session from SQLite with validation
   */
  getWithValidation: async (): Promise<{
    success: boolean;
    data?: {
      id: string;
      email: string;
      name: string;
      accessToken: string;
    };
    error?: string;
  }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      
      const [results] = await db.executeSql(
        'SELECT * FROM user_session WHERE id = 1'
      );
      
      if (results.rows.length > 0) {
        const userSession = results.rows.item(0);
        
        // Check if we have a valid access token
        if (userSession.access_token && userSession.access_token.trim() !== '') {
          const token = userSession.access_token.trim();
          
          // Basic token validation (should be a proper token format)
          if (token.length < 20) {
            return { success: false, error: 'Invalid token format' };
          }
          
          const userData = {
            id: userSession.user_id,
            email: userSession.email,
            name: userSession.name,
            accessToken: userSession.access_token
          };
          return { success: true, data: userData };
        } else {
          return { success: false, error: 'No valid access token found' };
        }
      } else {
        return { success: false, error: 'No user session found' };
      }
    } catch (error: any) {
      
      let errorMessage = 'Failed to check user session locally';
      if (error.message) {
        errorMessage = `Session check failed: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Get existing user session from SQLite (simple)
   */
  get: async (): Promise<{
    success: boolean;
    data?: {
      id: string;
      email: string;
      name: string;
      accessToken: string;
    };
    error?: string;
  }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      
      const result = await db.executeSql(
        'SELECT user_id, email, name, access_token FROM user_session WHERE id = 1 LIMIT 1'
      );
      
      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        
        return {
          success: true,
          data: {
            id: row.user_id,
            email: row.email,
            name: row.name,
            accessToken: row.access_token
          }
        };
      } else {
        return {
          success: true,
          data: undefined
        };
      }
    } catch (error: any) {
      
      let errorMessage = 'Failed to get user session locally';
      if (error.message) {
        errorMessage = `Failed to get user session: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Get extended user session with timestamps
   */
  getExtended: async (): Promise<{
    success: boolean;
    data?: {
      id: string;
      email: string;
      name: string;
      accessToken: string;
      createdAt?: string;
      updatedAt?: string;
      lastSyncAt?: string;
    };
    error?: string;
  }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      
      const [results] = await db.executeSql(
        'SELECT * FROM user_session WHERE id = 1'
      );
      
      if (results.rows.length > 0) {
        const userSession = results.rows.item(0);
        
        const userData = {
          id: userSession.user_id,
          email: userSession.email,
          name: userSession.name,
          accessToken: userSession.access_token,
          createdAt: userSession.created_at,
          updatedAt: userSession.updated_at,
          lastSyncAt: userSession.last_sync_at
        };
        
        return { success: true, data: userData };
      } else {
        return { success: false, error: 'No user session found in local storage' };
      }
    } catch (error: any) {
      
      let errorMessage = 'Failed to fetch user session from local storage';
      if (error.message) {
        errorMessage = `Failed to get extended session: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Update user session data
   */
  update: async (userData: {
    id: string;
    email: string;
    name: string;
    accessToken: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbInit = DatabaseInit.getInstance();
      const db = dbInit.getDatabase();
      const currentTime = DatabaseHelpers.getCurrentTimestamp();
      
      await db.executeSql(
        `UPDATE user_session 
         SET user_id = ?, email = ?, name = ?, access_token = ?, updated_at = ?
         WHERE id = 1`,
        [userData.id, userData.email, userData.name, userData.accessToken, currentTime]
      );
      return { success: true };
    } catch (error: any) {
      
      let errorMessage = 'Failed to update user session locally';
      if (error.message) {
        errorMessage = `Failed to update user session: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}; 