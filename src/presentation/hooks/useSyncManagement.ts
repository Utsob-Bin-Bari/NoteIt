import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { syncQueueService, QueueOperation } from '../../application/services/notes/syncQueueService';
import { clearFailedDeleteOperations } from '../../application/services/notes/clearFailedDeletes';

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
      console.error('❌ Error loading sync data:', error);
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
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              // Since operations are disabled, just show a message
              setOperationStates(prev => ({ ...prev, [operationId]: 'completed' }));
              
              // Refresh data after a delay
              setTimeout(async () => {
                await loadSyncData();
                setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
              }, 1000);
            }
          }
        ]
      );
    } catch (error) {
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
      // Since sync is disabled, just show a completed state
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, [operationId]: 'completed' }));
        
        // Reset state after delay
        setTimeout(() => {
          setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
        }, 2000);
      }, 1000);
      
    } catch (error) {
      setOperationStates(prev => ({ ...prev, [operationId]: 'failed' }));
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, [operationId]: 'idle' }));
      }, 3000);
    }
  };

  /**
   * Handle sync all operations (mock for disabled sync)
   */
  const handleSyncAll = async () => {
    Alert.alert(
      'Sync All Operations',
      'Sync functionality is currently disabled for local-only operation. Operations are stored but not synced to server.',
      [{ text: 'OK' }]
    );
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
      console.error('❌ Error clearing failed delete operations:', error);
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