import { SignUpRequest } from '../../../domain/types/auth/SignUpType';
import { signUpRequest } from '../../../infrastructure/api/requests/auth/signUpRequest';
import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';

export const validateSignupForm = (
  email: string, 
  password: string, 
  confirmPassword: string,
  name: string
): { 
  isValid: boolean; 
  fieldErrors: {
    name: string[];
    email: string[];
    password: string[];
    confirmPassword: string[];
  };
} => {
  const fieldErrors = {
    name: [] as string[],
    email: [] as string[],
    password: [] as string[],
    confirmPassword: [] as string[]
  };
  
  // Name validation
  if (!name.trim()) {
    fieldErrors.name.push('Full name is required');
  } else if (name.trim().length < 2) {
    fieldErrors.name.push('Full name must be at least 2 characters');
  }
  
  // Email validation
  if (!email.trim()) {
    fieldErrors.email.push('Email is required');
  } else {
    // Comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      fieldErrors.email.push('Please enter a valid email address');
    } else if (email.length > 254) {
      fieldErrors.email.push('Email address is too long');
  }
  }
  
  // Password validation
  if (!password.trim()) {
    fieldErrors.password.push('Password is required');
  } else if (password.length < 6) {
    fieldErrors.password.push('Password must be at least 6 characters');
  }
  
  // Confirm password validation
  if (!confirmPassword.trim()) {
    fieldErrors.confirmPassword.push('Please confirm your password');
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword.push('Passwords do not match');
  }
  
  const totalErrors = fieldErrors.name.length + fieldErrors.email.length + 
                     fieldErrors.password.length + fieldErrors.confirmPassword.length;
  
  return {
    isValid: totalErrors === 0,
    fieldErrors
  };
};

export const signupUser = async (credentials: SignUpRequest): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> => {
  try {
    // Make API request
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
      return {
        success: false,
        error: response?.message || 'Signup failed. Please try again.'
      };
    }
  } catch (error: any) {
    console.log('Signup error:', error);
    
    // Handle different types of errors
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Email already exists or invalid data provided'
      };
    } else if (error.response?.status === 409) {
      return {
        success: false,
        error: 'An account with this email already exists'
    };
    } else if (error.response?.status === 422) {
      return {
        success: false,
        error: 'Please check your information and try again'
      };
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
    
    return {
      success: false,
      error: 'Signup failed. Please try again.'
    };
  }
};

export const storeNewUserSession = async (userData: {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    const db = dbInit.getDatabase();
    const currentTime = DatabaseHelpers.getCurrentTimestamp();
    
    // Store new user session in SQLite
    await db.executeSql(
      `INSERT OR REPLACE INTO user_session 
       (id, user_id, email, name, access_token, created_at, updated_at) 
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [userData.id, userData.email, userData.name, userData.accessToken, currentTime, currentTime]
    );
    
    console.log('New user session stored in SQLite successfully');
    return { success: true };
  } catch (error) {
    console.log('SQLite storage error during signup:', error);
    return {
      success: false,
      error: 'Failed to store user session locally'
    };
  }
}; 