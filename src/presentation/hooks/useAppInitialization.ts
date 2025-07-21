import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkExistingUserSession } from '../../application/services/auth/loginService';
import { setUserInfo } from '../../application/store/action/auth/setUserInfo';
import { startSQLiteConnection } from '../../infrastructure/storage/SQLiteStart';

export const useAppInitialization = () => {
  const dispatch = useDispatch();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializationError, setInitializationError] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsInitializing(true);
    setInitializationError('');
    
    try {
      // Step 1: Initialize SQLite database
      const dbInitialized = await startSQLiteConnection();
      
      if (!dbInitialized) {
        throw new Error('Failed to initialize database');
      }
      
      // Step 2: Check for existing user session (auto-login)
      const sessionResult = await checkExistingUserSession();
      
      if (sessionResult.success && sessionResult.data) {
        // Step 3: Auto-login - populate Redux with existing session
        dispatch(setUserInfo(sessionResult.data));
        setIsLoggedIn(true);
      } else {
        // No existing session or invalid session
        setIsLoggedIn(false);
      }
      
    } catch (error) {
      setInitializationError('Failed to initialize app. Please restart.');
      setIsLoggedIn(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const retryInitialization = () => {
    initializeApp();
  };

  return {
    isInitializing,
    isLoggedIn,
    initializationError,
    retryInitialization,
  };
}; 