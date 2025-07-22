/**
 * Domain-level validation for note sharing
 */
export const validateShareEmail = (email: string): { 
  isValid: boolean; 
  fieldErrors: {
    email: string[];
  };
} => {
  const fieldErrors = {
    email: [] as string[]
  };
  
  // Email validation - same comprehensive validation as signup
  if (!email.trim()) {
    fieldErrors.email.push('Email is required');
  } else {
    // Comprehensive email validation (same as signup)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      fieldErrors.email.push('Please enter a valid email address');
    } else if (email.length > 254) {
      fieldErrors.email.push('Email address is too long');
    }
  }
  
  const totalErrors = fieldErrors.email.length;
  
  return {
    isValid: totalErrors === 0,
    fieldErrors
  };
}; 