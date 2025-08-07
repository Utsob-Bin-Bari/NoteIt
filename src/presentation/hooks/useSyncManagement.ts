import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { syncQueueService, QueueOperation } from '../../application/services/notes/syncQueueService';
import { clearFailedDeleteOperations } from '../../application/services/notes/clearFailedDeletes';
import { manualProcessQueue } from '../../application/services/notes/syncProcessor';

type OperationState = 'idle' | 'loading' | 'completed' | 'failed';

/**
 * Sync management hook - NOW SHOWS REAL DATABASE OPERATIONS
 * ✅ ENABLED: Shows actual sync queue operations from database
 */
export const useSyncManagement = () => {
  const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [allOperations, setAllOperations] = useState<QueueOperation[]>([]);
  const [pendingOperations, setPendingOperations] = useState<QueueOperation[]>([]);
  const [failedOperations, setFailedOperations] = useState<QueueOperation[]>([]);
  const [realQueueStatus, setRealQueueStatus] = useState<{pending: number, failed: number, completed: number, total: number}>({ 
    pending: 0, 
    failed: 0, 
    completed: 0, 
    total: 0 
  });
  const [queueStatus, setQueueStatus] = useState<{pending: number, failed: number}>({ pending: 0, failed: 0 });
  const [operationStates, setOperationStates] = useState<{[key: number]: OperationState}>({});
  const [clearFailedDeletesState, setClearFailedDeletesState] = useState<OperationState>('idle');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  /**
   * ✅ ENABLED: Load ALL sync data from database for FlashList display
   * Shows persistent database results as requested
   */
  const loadSyncData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get ALL operations from database (not just pending/failed)
      const allOps = await syncQueueService.getAllOperations();
      setAllOperations(allOps);
      
      // Filter operations by status for compatibility with existing UI
      const pending = allOps.filter(op => op.status === 'pending');
      const failed = allOps.filter(op => op.status === 'failed');
      
      setPendingOperations(pending);
      setFailedOperations(failed);
      
      // Get real database status
      const realStatus = await syncQueueService.getRealQueueStatus();
      setRealQueueStatus(realStatus);
      
      // Set legacy queue status for existing UI components
      setQueueStatus({ 
        pending: realStatus.pending, 
        failed: realStatus.failed 
      });
      
    } catch (error: any) {
      console.log('Error loading sync data:', error);
      setError(error.message || 'Failed to load sync data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle individual operation deletion
   */
  const handleDeleteOperation = async (operationId: number) => {
    setOperationStates(prev => ({ ...prev, [operationId]: 'loading' }));
    
    try {
      // Find operation to show user info
      const operation = allOperations.find(op => op.id === operationId);
      const operationName = operation ? 
        `${operation.operation_type.toUpperCase()} ${operation.entity_type} (${operation.entity_id.substring(0, 8)})` :
        `Operation #${operationId}`;
      
      Alert.alert(
        'Delete Operation', 
        `Are you sure you want to delete "${operationName}"?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
          }},
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                // Actually delete the operation from database
                await syncQueueService.markOperationCompleted(operationId);
                setOperationStates(prev => ({ ...prev, [operationId]: 'completed' }));
                
                // Refresh data to show updated list
                setTimeout(async () => {
                  await loadSyncData();
                  setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
                }, 500);
              } catch (deleteError: any) {
                console.log('Error deleting operation:', deleteError);
                setOperationStates(prev => ({ ...prev, [operationId]: 'failed' }));
                setTimeout(() => {
                  setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
                }, 2000);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log('Error in delete operation handler:', error);
      setOperationStates(prev => ({ ...prev, [operationId]: 'failed' }));
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
      }, 2000);
    }
  };

  /**
   * Handle individual operation sync retry
   */
  const handleSyncOperation = async (operationId: number) => {
    setOperationStates(prev => ({ ...prev, [operationId]: 'loading' }));
    
    try {
      // Reset the failed operation to pending status
      await syncQueueService.resetFailedOperation(operationId);
      
      // Trigger queue processing to attempt sync
      await manualProcessQueue();
      
      setOperationStates(prev => ({ ...prev, [operationId]: 'completed' }));
      
      // Refresh data to show updated status
      setTimeout(async () => {
        await loadSyncData();
        setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
      }, 1000);
      
    } catch (error: any) {
              console.log('Error retrying operation:', error);
      setOperationStates(prev => ({ ...prev, [operationId]: 'failed' }));
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
      }, 3000);
    }
  };

  /**
   * Handle sync all failed operations - Reset all failed operations and trigger queue processing
   */
  const handleSyncAll = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Reset all failed operations to pending status
      const resetCount = await syncQueueService.resetAllFailedOperations();
      
      if (resetCount === 0) {
        Alert.alert(
          'No Failed Operations',
          'There are no failed operations to retry.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Trigger queue processing to attempt sync for all operations
      const result = await manualProcessQueue();
      
      // Refresh data to show updated status
      await loadSyncData();
      
      Alert.alert(
        'Retry Completed',
        `Reset ${resetCount} failed operation(s) and triggered sync processing. Check the operations list for updated status.`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.log('Error in sync all operations:', error);
      setError(error.message || 'Failed to retry operations');
      Alert.alert(
        'Retry Failed',
        'Failed to retry operations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle clear completed operations
   */
  const handleClearCompleted = async () => {
    Alert.alert(
      'Clear Completed',
      'This would clear completed operations from the sync queue when sync functionality is enabled.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle clear failed deletes
   */
  const handleClearFailedDeletes = async () => {
    setClearFailedDeletesState('loading');
    
    try {
      // This function still works even with sync disabled
      const result = await clearFailedDeleteOperations();
      
      setClearFailedDeletesState('completed');
      
      // Reload data to refresh the list
      await loadSyncData();
      
      Alert.alert(
        'Success', 
        `Cleared ${result.cleared} failed delete operation(s).`
      );
      
      // Clear the state after a delay
      setTimeout(() => {
        setClearFailedDeletesState('idle');
      }, 2000);
      
    } catch (error: any) {
      console.log('Error clearing failed delete operations:', error);
      setClearFailedDeletesState('failed');
      Alert.alert('Error', 'Failed to clear failed delete operations.');
      
      // Clear failed state after delay
      setTimeout(() => {
        setClearFailedDeletesState('idle');
      }, 3000);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadSyncData();
  }, []);

  return {
    // State
    loading,
    error,
    allOperations, // NEW: All operations for FlashList
    pendingOperations,
    failedOperations,
    queueStatus, // Legacy for existing UI
    realQueueStatus, // NEW: Real database status
    operationStates,
    clearFailedDeletesState,
    
    // Handlers
    handleBack,
    handleSettings,
    handleDeleteOperation,
    handleSyncOperation,
    handleSyncAll,
    handleClearCompleted,
    handleClearFailedDeletes,
    loadSyncData, // For manual refresh
  };
}; 