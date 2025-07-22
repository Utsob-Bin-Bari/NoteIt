import { userSessionStorage } from '../../../infrastructure/storage/userSessionStorage';
import { AuthState } from '../../../domain/types/store/AuthState';

interface ExtendedUserSessionData extends AuthState {
  createdAt?: string;
  updatedAt?: string;
  lastSyncAt?: string;
}

/**
 * Application layer: Fetch extended user session data
 */
export const fetchLocalUserSession = async (): Promise<{ 
  success: boolean; 
  data?: ExtendedUserSessionData; 
  error?: string;
}> => {
  try {
    
    const result = await userSessionStorage.getExtended();
    
    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        error: result.error || 'No user session found in local storage' 
      };
    }
  } catch (error: any) {
    
    let errorMessage = 'Failed to fetch user session from local storage';
    if (error.message) {
      errorMessage = `Fetch session failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}; 