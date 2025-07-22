import { SignUpRequest } from '../../../../domain/types/auth/SignUpType';
import { signUpRequest } from '../../../../infrastructure/api/requests/auth/signUpRequest';

/**
 * Register new user with email, password, and name
 */
export const signupUser = async (credentials: SignUpRequest): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> => {
  try {
    
    const response = await signUpRequest({ requestBody: credentials });
    
    if (response && response.access_token) {
      return {
        success: true,
        data: { 
          user: response.user,
          token: response.access_token
        }
      };
    } else {
      const errorMessage = response?.message || 'Signup failed. Please try again.';
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error: any) {
    
    // Extract actual error message from response
    let errorMessage = 'Signup failed. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Handle specific HTTP status codes with actual messages
    if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Email already exists or invalid data provided';
    } else if (error.response?.status === 409) {
      errorMessage = error.response.data?.message || 'An account with this email already exists';
    } else if (error.response?.status === 422) {
      errorMessage = error.response.data?.message || 'Please check your information and try again';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    
    return {
      success: false,
      error: errorMessage
    };
  }
}; 