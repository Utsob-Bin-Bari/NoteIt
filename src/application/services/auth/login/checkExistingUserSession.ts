import { userSessionStorage } from '../../../../infrastructure/storage/userSessionStorage';
import { AuthState } from '../../../../domain/types/store/AuthState';

/**
 * Application layer: Check if a valid user session exists for auto-login (business logic)
 */
export const checkExistingUserSession = async (): Promise<{ 
  success: boolean; 
  data?: AuthState; 
  error?: string;
}> => {
  try {
    
    // Call infrastructure layer with validation
    const result = await userSessionStorage.getWithValidation();
    
    if (result.success && result.data) {
      // Convert to AuthState format for application layer
      const userData: AuthState = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        accessToken: result.data.accessToken
      };
      return { success: true, data: userData };
    } else {
      return { 
        success: false, 
        error: result.error || 'No valid user session found' 
      };
    }
  } catch (error: any) {
    
    let errorMessage = 'Failed to check user session';
    if (error.message) {
      errorMessage = `Session check failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}; 