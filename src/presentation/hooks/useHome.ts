import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { RootState } from '../../domain/types/store/RootState';
import { AuthState } from '../../domain/types/store/AuthState';
import { fetchLocalUserSession } from '../../application/services/user/userService';
import { logoutUser } from '../../application/services/auth/loginService';
import { logOut } from '../../application/store/action/auth/logOut';

interface ExtendedUserSessionData extends AuthState {
  createdAt?: string;
  updatedAt?: string;
  lastSyncAt?: string;
}

export const useHome = () => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  const dispatch = useDispatch();
  
  // Redux user data
  const reduxUserData = useSelector((state: RootState) => state.auth);
  
  // Local state
  const [localUserData, setLocalUserData] = useState<ExtendedUserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch local user data on component mount
  useEffect(() => {
    loadLocalUserData();
  }, []);

  const loadLocalUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await fetchLocalUserSession();
      
      if (result.success && result.data) {
        setLocalUserData(result.data);
      } else {
        setError(result.error || 'Failed to load local user data');
      }
    } catch (error) {
      setError('Something went wrong while loading user data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    
    try {
      // Step 1: Clear SQLite storage
      const result = await logoutUser();
      
      // Step 2: Clear Redux store
      dispatch(logOut());
      
      // Step 3: Clear local state
      setLocalUserData(null);
      setError('');
      
      // Step 4: Navigate to login screen
      navigation.navigate('Login');
      
    } catch (error) {
      setError('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const navigateToNote = () => {
    navigation.navigate('Note');
  };

  const refreshUserData = () => {
    loadLocalUserData();
  };

  // Check if user is logged in (either Redux or local data exists)
  const isLoggedIn = !!(reduxUserData?.id || localUserData?.id);

  return {
    // User data
    reduxUserData,
    localUserData,
    isLoggedIn,
    
    // State
    loading,
    error,
    loggingOut,
    
    // Actions
    navigateToNote,
    refreshUserData,
    handleLogout,
  };
}; 