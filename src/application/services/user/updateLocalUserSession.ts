import { userSessionStorage } from '../../../infrastructure/storage/userSessionStorage';
import { AuthState } from '../../../domain/types/store/AuthState';

/**
 * Application layer: Update local user session data (business logic)
 */
export const updateLocalUserSession = async (userData: AuthState): Promise<{ 
  success: boolean; 
  error?: string;
}> => {
  try {
    
    if (!userData.id || !userData.email || !userData.accessToken) {
      return {
        success: false,
        error: 'Invalid user data: missing required fields'
      };
    }
    
    const result = await userSessionStorage.update(userData);
    
    if (result.success) {
    } else {
    }
    
    return result;
  } catch (error: any) {
    
    let errorMessage = 'Failed to update user session in local storage';
    if (error.message) {
      errorMessage = `Update session failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}; 