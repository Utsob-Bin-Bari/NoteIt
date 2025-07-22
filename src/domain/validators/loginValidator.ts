/**
 * Domain-level validation for login credentials
 */
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