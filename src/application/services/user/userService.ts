import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { AuthState } from '../../../domain/types/store/AuthState';

interface ExtendedUserSessionData extends AuthState {
  createdAt?: string;
  updatedAt?: string;
  lastSyncAt?: string;
}

export const fetchLocalUserSession = async (): Promise<{ 
  success: boolean; 
  data?: ExtendedUserSessionData; 
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
      
      const userData: ExtendedUserSessionData = {
        id: userSession.user_id,
        email: userSession.email,
        name: userSession.name,
        accessToken: userSession.access_token,
        createdAt: userSession.created_at,
        updatedAt: userSession.updated_at,
        lastSyncAt: userSession.last_sync_at
      };
      
      console.log('Local user session fetched successfully:', userData.email);
      return { success: true, data: userData };
    } else {
      return { success: false, error: 'No user session found in local storage' };
    }
  } catch (error) {
    console.log('Error fetching local user session:', error);
    return { success: false, error: 'Failed to fetch user session from local storage' };
  }
};

export const clearLocalUserSession = async (): Promise<{ 
  success: boolean; 
  error?: string;
}> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    const db = dbInit.getDatabase();
    
    await db.executeSql('DELETE FROM user_session');
    
    console.log('Local user session cleared successfully');
    return { success: true };
  } catch (error) {
    console.log('Error clearing local user session:', error);
    return { success: false, error: 'Failed to clear user session from local storage' };
  }
};

export const updateLocalUserSession = async (userData: AuthState): Promise<{ 
  success: boolean; 
  error?: string;
}> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    const db = dbInit.getDatabase();
    const currentTime = new Date().toISOString();
    
    await db.executeSql(
      `UPDATE user_session 
       SET user_id = ?, email = ?, name = ?, access_token = ?, updated_at = ?
       WHERE id = 1`,
      [userData.id, userData.email, userData.name, userData.accessToken, currentTime]
    );
    
    console.log('Local user session updated successfully');
    return { success: true };
  } catch (error) {
    console.log('Error updating local user session:', error);
    return { success: false, error: 'Failed to update user session in local storage' };
  }
}; 