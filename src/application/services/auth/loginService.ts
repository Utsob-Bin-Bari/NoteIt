import { LoginRequest } from '../../../domain/types/Auth/LoginType';

export const validateLoginForm = (email: string, password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!email.trim()) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push('Email is invalid');
  }
  
  if (!password.trim()) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const loginUser = async (credentials: LoginRequest): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // TODO: Replace with actual API call
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'test@test.com' && credentials.password === 'password') {
      return {
        success: true,
        data: { 
          user: { id: 1, email: credentials.email }, 
          token: 'sample-token' 
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Login failed. Please try again.'
    };
  }
}; 