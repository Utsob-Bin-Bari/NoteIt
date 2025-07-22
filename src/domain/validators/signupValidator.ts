/**
 * Domain-level validation for signup form
 */
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