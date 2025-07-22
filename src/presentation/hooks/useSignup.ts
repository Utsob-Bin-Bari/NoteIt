import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { validateSignupForm } from '../../domain/validators/signupValidator';
import { signupUser } from '../../application/services/auth/signup';
import { storeUserSession } from '../../application/services/auth/login';
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

    const validation = validateSignupForm(email, password, confirmPassword, name);
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setLoading(true);
    
    try {
      const result = await signupUser({ name, email, password });
      
      if (result.success && result.data) {
        const { user, token } = result.data;
        
        const userInfo = {
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: token
        };
        
        dispatch(setUserInfo(userInfo));
        
        const storageResult = await storeUserSession(userInfo);
        
        if (storageResult.success) {
          navigation.navigate('Home');
        } else {
          navigation.navigate('Home');
        }
      } else {  
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