import { LoginRequest } from '../../../../domain/types/auth/LoginType';
import { loginRequest } from '../../../../infrastructure/api/requests/auth/loginRequest';

/**
 * Authenticate user with email and password
 */
export const loginUser = async (credentials: LoginRequest): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> => {
  try {
    const response = await loginRequest({ requestBody: credentials });
    
    if (response && response.access_token) {
      return {
        success: true,
        data: { 
          user: response.user,
          token: response.access_token
        }
      };
    } else {
      const errorMessage = response?.message || 'Login failed. Please check your credentials.';
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error: any) {

    // Extract actual error message from response
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      errorMessage = error.response.data?.message || 'Invalid email or password';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Please check your email and password';
    } else if (error.response?.status === 422) {
      errorMessage = error.response.data?.message || 'Validation failed';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    
    return {
      success: false,
      error: errorMessage
    };
  }
}; 