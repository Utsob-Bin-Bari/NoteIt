import { userSessionStorage } from '../../../../infrastructure/storage/userSessionStorage';

/**
 * Application layer: Clear user session data (business logic)
 */
export const clearUserSession = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    
    // Call infrastructure layer for clearing
    const result = await userSessionStorage.clear();
    
    if (result.success) {
    } else {
      console.log('Application: Failed to clear user session:', result.error);
    }
    
    return result;
  } catch (error: any) {
    console.log('Application: Unexpected error clearing user session:', error);
    
    let errorMessage = 'Failed to clear user session';
    if (error.message) {
      errorMessage = `Clear session failed: ${error.message}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}; 