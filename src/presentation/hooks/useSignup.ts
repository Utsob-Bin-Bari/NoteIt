import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { validateSignupForm, signupUser, storeNewUserSession } from '../../application/services/auth';
import { setUserInfo } from '../../application/store/action/auth/setUserInfo';

export const useSignup = () => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  const dispatch = useDispatch();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: [] as string[],
    email: [] as string[],
    password: [] as string[],
    confirmPassword: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string>('');

  const handleSignup = async () => {
    setFieldErrors({
      name: [],
      email: [],
      password: [],
      confirmPassword: []
    });
    setSignupError('');
    
    // Validate form inputs
    const validation = validateSignupForm(email, password, confirmPassword, name);
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Backend request
      const result = await signupUser({ name, email, password });
      
      if (result.success && result.data) {
        const { user, token } = result.data;
        
        // Step 2: Update Redux store
        const userInfo = {
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: token
        };
        
        dispatch(setUserInfo(userInfo));
        
        // Step 3: Store in SQLite local storage
        const storageResult = await storeNewUserSession(userInfo);
        
        if (storageResult.success) {
          navigation.navigate('Home');
        } else {
          // Even if SQLite fails, we've signed up successfully
          navigation.navigate('Home');
        }
      } else {
        // Step 4: Show error message below signup button
        setSignupError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setSignupError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    fieldErrors,
    signupError,
    handleSignup,
    navigateToLogin,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  };
}; 