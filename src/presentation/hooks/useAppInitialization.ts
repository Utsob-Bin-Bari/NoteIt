import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseInit } from '../../infrastructure/storage/DatabaseInit';
import { RecoveryService } from '../../application/services/RecoveryService';
import { checkExistingUserSession } from '../../application/services/auth/login/checkExistingUserSession';
import { setUserInfo } from '../../application/store/action/auth/setUserInfo';
import { setAllNotes } from '../../application/store/action/notes/setAllNotes';
import { setAllBookmarks } from '../../application/store/action/bookmarks/setAllBookmarks';
import { notesSQLiteService } from '../../application/services/notes/notesSQLiteService';
import { bookmarksSQLiteService } from '../../application/services/bookmarks/bookmarksSQLiteService';
// 🚨 DISABLED: Auto-sync functionality removed
// import { initializeSyncProcessor } from '../../application/services/notes/syncProcessor';

export const useAppInitialization = () => {
  const dispatch = useDispatch();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRecovery, setAutoRecovery] = useState(false);
  const [recoveryReason, setRecoveryReason] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);


      // Step 1: Initialize database
      const dbInit = DatabaseInit.getInstance();
      await dbInit.initializeDatabase();

      // Step 2: Check for existing user session
      const sessionResult = await checkExistingUserSession();
      
      if (sessionResult.success && sessionResult.data) {
        
        // Auto login with existing session
        dispatch(setUserInfo(sessionResult.data));
        
        // Step 3: POPULATE REDUX FROM SQLITE (Our agreed plan)
        await populateReduxFromSQLite(sessionResult.data.id);
        
        // 🚨 DISABLED: Auto-sync functionality removed for local-only operation
        
        /*
        // TODO: Uncomment for future auto-sync implementation
        // Initialize sync processor for automatic background sync
        await initializeSyncProcessor();
        */

        // Step 4: Check if recovery is needed
        const recoveryCheck = await RecoveryService.detectRecoveryNeed(sessionResult.data.accessToken);
        
        if (recoveryCheck.needsRecovery) {
          // Check if backend has data before suggesting recovery
          try {
            const hasBackendData = await RecoveryService.checkBackendDataExists(sessionResult.data.accessToken);
            
            if (hasBackendData) {
              setAutoRecovery(true);
              setRecoveryReason(recoveryCheck.reason || 'Backend data available');
            }
          } catch (error) {
            // If backend check fails, don't trigger auto recovery
          }
        }
      } else {
        
        // Initialize empty Redux state for non-logged-in users
        dispatch(setAllNotes([]));
        dispatch(setAllBookmarks([]));
      }

      setIsInitialized(true);
    } catch (error: any) {
      console.error('❌ App initialization failed:', error);
      setError('Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * POPULATE REDUX FROM SQLITE - Core part of our agreed plan
   * User Action → SQLite Database → Redux Update → UI Refresh
   */
  const populateReduxFromSQLite = async (userId: string) => {
    try {
      const cleanupResult = await notesSQLiteService.cleanupCorruptedNotes(userId);
      const localNotes = await notesSQLiteService.fetchAllNotes(userId);
      dispatch(setAllNotes(localNotes));

      const localBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(userId);
      dispatch(setAllBookmarks(localBookmarks));

    } catch (error: any) {
      console.error('❌ Failed to populate Redux from SQLite:', error);
      
      // Initialize with empty arrays to prevent null errors
      dispatch(setAllNotes([]));
      dispatch(setAllBookmarks([]));
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    autoRecovery,
    recoveryReason,
  };
}; 