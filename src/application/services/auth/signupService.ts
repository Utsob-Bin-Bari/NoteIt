import { SignUpRequest } from '../../../domain/types/Auth/SignUpType';

export const validateSignupForm = (
  email: string, 
  password: string, 
  confirmPassword: string,
  name: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Name is required');
  }
  
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
  
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const signupUser = async (credentials: SignUpRequest): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // TODO: Replace with actual API call
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: { 
        user: { id: 1, email: credentials.email, name: credentials.name }, 
        token: 'sample-token' 
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Signup failed. Please try again.'
    };
  }
}; 