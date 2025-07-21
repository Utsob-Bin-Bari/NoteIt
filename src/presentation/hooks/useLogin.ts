import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { validateLoginForm, loginUser, storeUserSession } from '../../application/services/auth';
import { setUserInfo } from '../../application/store/action/auth/setUserInfo';

export const useLogin = () => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  const dispatch = useDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: [] as string[],
    password: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const handleLogin = async () => {
    setFieldErrors({
      email: [],
      password: []
    });
    setLoginError('');
    
    // Validate form inputs
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Backend request
      const result = await loginUser({ email, password });
      
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
        const storageResult = await storeUserSession(userInfo);
        
        if (storageResult.success) {
          navigation.navigate('Home');
        } else {
          // Even if SQLite fails, we've logged in successfully
          navigation.navigate('Home');
        }
      } else {
        // Step 4: Show error message below login button
        setLoginError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setLoginError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('SignUp');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    fieldErrors,
    loginError,
    handleLogin,
    navigateToSignup,
    showPassword,
    setShowPassword,
  };
}; 