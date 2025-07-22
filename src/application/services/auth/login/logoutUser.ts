import { clearUserSession } from './clearUserSession';

/**
 * Logout user and clear all local session data
 */
export const logoutUser = async (): Promise<{ 
  success: boolean; 
  error?: string;
}> => {
  try {
    
    // Clear SQLite user session
    const result = await clearUserSession();
    
    if (result.success) {
      return { success: true };
    } else {
      // Even if SQLite fails, we can still log out to avoid user being stuck
      return { success: true };
    }
  } catch (error: any) {
    
    let errorMessage = 'Failed to complete logout process';
    if (error.message) {
      errorMessage = `Logout failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}; 