import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../domain/types/store/RootState';
import { RecoveryService } from '../../application/services/RecoveryService';

interface RecoveryState {
  isRecovering: boolean;
  recoveryNeeded: boolean;
  canRecover: boolean;
  progress: {
    current: number;
    total: number;
    step: string;
  };
  result: {
    ownNotes: number;
    sharedNotes: number;
    bookmarkedNotes: number;
    userData: boolean;
  } | null;
  error: string;
}

export const useRecovery = () => {
  const userAuth = useSelector((state: RootState) => state.auth);
  
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    recoveryNeeded: false,
    canRecover: false,
    progress: {
      current: 0,
      total: 4,
      step: ''
    },
    result: null,
    error: ''
  });

  const checkRecoveryNeed = async (): Promise<boolean> => {
    try {
      const detection = await RecoveryService.detectRecoveryNeed(userAuth.accessToken);
      
      setRecoveryState(prev => ({
        ...prev,
        recoveryNeeded: detection.needsRecovery,
        canRecover: detection.canRecover,
        error: detection.needsRecovery ? detection.reason : ''
      }));

      return detection.needsRecovery;
    } catch (error) {
      setRecoveryState(prev => ({
        ...prev,
        error: `Recovery check failed: ${error}`
      }));
      return false;
    }
  };

  const performRecovery = async (): Promise<boolean> => {
    if (!userAuth.accessToken) {
      setRecoveryState(prev => ({
        ...prev,
        error: 'No access token available for recovery'
      }));
      return false;
    }

    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      progress: { current: 1, total: 4, step: 'Checking backend data...' },
      error: ''
    }));

    try {
      // Step 1: Check if backend has data
      const hasBackendData = await RecoveryService.checkBackendDataExists(userAuth.accessToken);
      
      if (!hasBackendData) {
        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          error: 'No data found on server to recover'
        }));
        return false;
      }

      // Step 2: Clear corrupted data if needed
      setRecoveryState(prev => ({
        ...prev,
        progress: { current: 2, total: 4, step: 'Preparing local database...' }
      }));
      
      await RecoveryService.clearCorruptedData();

      // Step 3: Perform recovery
      setRecoveryState(prev => ({
        ...prev,
        progress: { current: 3, total: 4, step: 'Restoring notes, bookmarks & shares...' }
      }));

      const result = await RecoveryService.performRecovery(userAuth.accessToken);

      if (result.success) {
        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          recoveryNeeded: false,
          result: result.recovered,
          progress: { current: 4, total: 4, step: 'Recovery completed successfully!' }
        }));
        return true;
      } else {
        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          error: result.error || 'Recovery failed'
        }));
        return false;
      }
    } catch (error) {
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        error: `Recovery failed: ${error}`
      }));
      return false;
    }
  };

  const resetRecoveryState = () => {
    setRecoveryState({
      isRecovering: false,
      recoveryNeeded: false,
      canRecover: false,
      progress: {
        current: 0,
        total: 4,
        step: ''
      },
      result: null,
      error: ''
    });
  };

  return {
    ...recoveryState,
    checkRecoveryNeed,
    performRecovery,
    resetRecoveryState,
  };
}; 