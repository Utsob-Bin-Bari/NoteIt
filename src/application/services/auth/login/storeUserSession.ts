import { userSessionStorage } from '../../../../infrastructure/storage/userSessionStorage';

/**
 * Application layer: Store user session data (business logic)
 */
export const storeUserSession = async (userData: {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    
    // Validate required fields at application level
    if (!userData.id || !userData.email || !userData.accessToken) {
      return {
        success: false,
        error: 'Invalid user data: missing required fields'
      };
    }
    
    // Call infrastructure layer for storage
    const result = await userSessionStorage.store(userData);
    
    if (result.success) {
    } else {
    }
    
    return result;
  } catch (error: any) {
    
    let errorMessage = 'Failed to store user session';
    if (error.message) {
      errorMessage = `Store session failed: ${error.message}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}; 