import { LoginRequest } from '../../../domain/types/auth/LoginType';
import { loginRequest } from '../../../infrastructure/api/requests/auth/loginRequest';
import { DatabaseInit } from '../../../infrastructure/storage/DatabaseInit';
import { DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';
import { AuthState } from '../../../domain/types/store/AuthState';

export const validateLoginForm = (email: string, password: string): { 
  isValid: boolean; 
  fieldErrors: {
    email: string[];
    password: string[];
  };
} => {
  const fieldErrors = {
    email: [] as string[],
    password: [] as string[]
  };
  
  // Email validation
  if (!email.trim()) {
    fieldErrors.email.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    fieldErrors.email.push('Email is invalid');
  }
  
  // Password validation
  if (!password.trim()) {
    fieldErrors.password.push('Password is required');
  } else if (password.length < 6) {
    fieldErrors.password.push('Password must be at least 6 characters');
  }
  
  const totalErrors = fieldErrors.email.length + fieldErrors.password.length;
  
  return {
    isValid: totalErrors === 0,
    fieldErrors
  };
};

export const loginUser = async (credentials: LoginRequest): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> => {
  try {
    // Make API request
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
      return {
        success: false,
        error: response?.message || 'Login failed. Please check your credentials.'
      };
    }
  } catch (error: any) {
    console.log('Login error:', error);
    
    // Handle different types of errors
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    } else if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Please check your email and password'
      };
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
    
    return {
      success: false,
      error: 'Login failed. Please try again.'
    };
  }
};

export const storeUserSession = async (userData: {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    const db = dbInit.getDatabase();
    const currentTime = DatabaseHelpers.getCurrentTimestamp();
    
    // Store user session in SQLite
    await db.executeSql(
      `INSERT OR REPLACE INTO user_session 
       (id, user_id, email, name, access_token, created_at, updated_at) 
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [userData.id, userData.email, userData.name, userData.accessToken, currentTime, currentTime]
    );
    
    console.log('User session stored in SQLite successfully');
    return { success: true };
  } catch (error) {
    console.log('SQLite storage error:', error);
    return {
      success: false,
      error: 'Failed to store user session locally'
    };
  }
};

export const clearUserSession = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    const db = dbInit.getDatabase();
    
    // Clear user session table completely
    await db.executeSql('DELETE FROM user_session');
    
    // Clear any user-related sync queue items (optional, but thorough)
    await db.executeSql('DELETE FROM sync_queue WHERE entity_type = ?', ['user']);
    
    console.log('User session and related data cleared from SQLite');
    return { success: true };
  } catch (error) {
    console.log('SQLite clear error:', error);
    return {
      success: false,
      error: 'Failed to clear user session'
    };
  }
}; 

export const logoutUser = async (): Promise<{ 
  success: boolean; 
  error?: string;
}> => {
  try {
    // Clear SQLite user session
    const result = await clearUserSession();
    
    if (result.success) {
      console.log('Logout completed successfully');
      return { success: true };
    } else {
      console.log('SQLite clear failed during logout:', result.error);
      // Even if SQLite fails, we can still log out
      return { success: true };
    }
  } catch (error) {
    console.log('Error during logout:', error);
    return { 
      success: false, 
      error: 'Failed to complete logout process' 
    };
  }
}; 

export const checkExistingUserSession = async (): Promise<{ 
  success: boolean; 
  data?: AuthState; 
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
      
      // Check if we have a valid access token
      if (userSession.access_token && userSession.access_token.trim() !== '') {
        const token = userSession.access_token.trim();
        
        // Basic token validation (should be a proper token format)
        if (token.length < 20) {
          console.log('Token too short, likely invalid');
          return { success: false, error: 'Invalid token format' };
        }
        
        const userData: AuthState = {
          id: userSession.user_id,
          email: userSession.email,
          name: userSession.name,
          accessToken: userSession.access_token
        };
        
        console.log('Valid user session found for auto-login:', userData.email);
        return { success: true, data: userData };
      } else {
        console.log('User session found but no valid access token');
        return { success: false, error: 'No valid access token found' };
      }
    } else {
      console.log('No existing user session found');
      return { success: false, error: 'No user session found' };
    }
  } catch (error) {
    console.log('Error checking existing user session:', error);
    return { success: false, error: 'Failed to check user session' };
  }
}; 