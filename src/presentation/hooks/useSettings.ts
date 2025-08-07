import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { clearDataService } from '../../application/services/data';
import { clearAllNotes, setAllNotes } from '../../application/store/action/notes';
import { clearAllBookmarks, setAllBookmarks } from '../../application/store/action/bookmarks';
import { RecoveryService } from '../../application/services/RecoveryService';
import { RootState } from '../../domain/types/store/RootState';

type OperationState = 'idle' | 'loading' | 'completed' | 'failed';

interface UseSettingsProps {
  autoRecovery?: boolean;
  recoveryReason?: string;
}

export const useSettings = ({ autoRecovery = false, recoveryReason = '' }: UseSettingsProps = {}) => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clearDataState, setClearDataState] = useState<OperationState>('idle');
  const [recoverDataState, setRecoverDataState] = useState<OperationState>('idle');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSettings = () => {
    // Settings button pressed
  };

  // Handle auto recovery when screen loads
  useEffect(() => {
    if (autoRecovery && recoveryReason) {
      // Show alert asking if user wants to proceed with auto recovery
      Alert.alert(
        'Data Recovery Available',
        `Data recovery is recommended: ${recoveryReason}\n\nWould you like to recover your data now?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Recover',
            onPress: () => {
              performRecoverDataOperation();
            },
          },
        ]
      );
    }
  }, [autoRecovery, recoveryReason]);

  const performClearDataOperation = async () => {
    setClearDataState('loading');
    
    try {
      // 1. Get detailed preview of what will be cleared vs preserved
      const preview = await clearDataService.getClearDataPreview();
      
      // 2. Get data statistics before clearing
      const statsBefore = await clearDataService.getDataStatistics();
      
      // 3. Clear all data except user session (HARD DELETE)
      const result = await clearDataService.clearAllDataExceptUser();
      
      if (result.success) {
        // 4. Clear Redux state immediately
        dispatch(clearAllNotes());
        dispatch(clearAllBookmarks());
        
        // 5. Verify user session is still intact
        const userSessionIntact = await clearDataService.verifyUserSession();
        
        // 6. Verify database is actually clean
        const statsAfter = await clearDataService.getDataStatistics();
        
        if (userSessionIntact && 
            statsAfter.notes === 0 && 
            statsAfter.syncQueue === 0) {
          
          setClearDataState('completed');
          
          Alert.alert(
            'Data Cleared',
            `Successfully deleted ${result.cleared.notes} notes and all associated data. Your login session has been preserved.`,
            [{ text: 'OK' }]
          );
        } else {
          setClearDataState('failed');
          
          Alert.alert(
            'Clear Data Failed',
            'Data clearing completed but verification failed. Some data may not have been cleared properly.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setClearDataState('failed');
        console.log('Clear data operation failed:', result.error);
        Alert.alert(
          'Clear Failed', 
          result.error || 'Failed to clear data. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setClearDataState('failed');
      console.log('Clear data operation error:', error);
      Alert.alert(
        'Clear Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
    
    // Reset to idle after 3 seconds
    setTimeout(() => setClearDataState('idle'), 3000);
  };

  const performRecoverDataOperation = async () => {
    setRecoverDataState('loading');
    
    try {
      if (!authState.accessToken) {
        console.log('No access token available for recovery');
        setRecoverDataState('failed');
        setTimeout(() => setRecoverDataState('idle'), 2000);
        return;
      }

      // 1. Check if backend has data before attempting recovery
      const backendHasData = await RecoveryService.checkBackendDataExists(authState.accessToken);
      
      if (!backendHasData) {
        Alert.alert(
          'No Data Available',
          'No data was found on the server for your account.',
          [{ text: 'OK' }]
        );
        setRecoverDataState('failed');
        setTimeout(() => setRecoverDataState('idle'), 2000);
        return;
      }
      
      // 2. Perform actual recovery from backend server
      const recoveryResult = await RecoveryService.performRecovery(authState.accessToken);
      
      if (recoveryResult.success) {
        // 3. Refresh data in Redux store by fetching from local database
        // The RecoveryService already saved data to SQLite, now we need to load it into Redux
        await refreshDataFromLocalDatabase();
        
        // 4. Show success with recovery statistics
        const totalNotes = recoveryResult.recovered.ownNotes + recoveryResult.recovered.sharedNotes + recoveryResult.recovered.bookmarkedNotes;
        
        Alert.alert(
          'Recovery Complete',
          `Successfully recovered ${totalNotes} notes from the server. Your local data has been updated.`,
          [{ text: 'OK' }]
        );
        
        setRecoverDataState('completed');
      } else {
        console.log('Recovery from BACKEND SERVER failed:', recoveryResult.error);
        setRecoverDataState('failed');
      }
    } catch (error) {
      console.log('Recovery operation error:', error);
      setRecoverDataState('failed');
    }
    
    // Reset to idle after 2 seconds
    setTimeout(() => setRecoverDataState('idle'), 2000);
  };

  const refreshDataFromLocalDatabase = async () => {
    try {
      if (!authState.id) {
        console.log('No user ID available for data refresh');
        return;
      }

      // Import the services we need
      const { notesSQLiteService } = await import('../../application/services/notes/notesSQLiteService');
      const { bookmarksSQLiteService } = await import('../../application/services/bookmarks/bookmarksSQLiteService');
      
      // Fetch updated data from local database
      const [notes, bookmarks] = await Promise.all([
        notesSQLiteService.fetchAllNotes(authState.id),
        bookmarksSQLiteService.fetchBookmarkedNotes(authState.id)
      ]);
      
      // Update Redux store
      dispatch(setAllNotes(notes));
      dispatch(setAllBookmarks(bookmarks));
    } catch (error) {
      console.log('Error refreshing data from local database:', error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will permanently delete all notes, bookmarks, and settings from this device. Your login session will be preserved.\n\nThis action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            performClearDataOperation();
          },
        },
      ]
    );
  };

  const handleRecoverData = () => {
    Alert.alert(
      'Recover Data',
      'This will download data from the server and overwrite your local storage. Any unsynced local data will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Recover',
          style: 'default',
          onPress: () => {
            performRecoverDataOperation();
          },
        },
      ]
    );
  };

  const handleSyncManagement = () => {
    navigation.navigate('SyncManagement');
  };

  return {
    loading,
    error,
    clearDataState,
    recoverDataState,
    handleBack,
    handleSettings,
    handleClearData,
    handleRecoverData,
    handleSyncManagement,
  };
}; 