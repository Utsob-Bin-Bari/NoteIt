import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncQueueService } from '../../application/services/notes/syncQueueService';
import { getSyncProcessorStatus, triggerImmediateSync } from '../../application/services/notes/syncProcessor';

type SyncState = 'offline' | 'syncing' | 'synced' | 'failed' | 'idle';

/**
 * Sync status hook for UI compatibility
 * 🚨 DISABLED: Sync operations disabled - shows network status instead of sync status
 */
export const useSyncStatus = () => {
  const { isConnected } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [queueStatus, setQueueStatus] = useState<{pending: number, failed: number}>({ pending: 0, failed: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load queue status (DISABLED - shows network status for UI)
   * 🚨 DISABLED: Shows network status instead of sync status
   */
  const loadQueueStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // 🚨 DISABLED: Returns mock data for UI compatibility
      const status = await syncQueueService.getQueueStatus(); // This returns { pending: 0, failed: 0 }
      const processorStatus = getSyncProcessorStatus(); // This returns { isRunning: false, isProcessing: false }
      
      setQueueStatus(status);
      
      // 🚨 DISABLED: Show network status instead of sync status for better UX
      if (!isConnected) {
        setSyncState('offline');
      } else {
        setSyncState('synced'); // Show as synced when online since sync is disabled
        setLastSyncTime(new Date());
      }
      
    } catch (error: any) {
      console.error('❌ Error loading network status:', error);
      setSyncState('failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected]);

  // Sync state effect
  useEffect(() => {
    switch (syncState) {
      case 'offline':
        break;
      case 'syncing':
        break;
      case 'failed':
        break;
      case 'synced':
        break;
      default:
        break;
    }
  }, [syncState]);

  /**
   * Manual retry function (DISABLED - no operations to retry)
   * 🚨 DISABLED: Sync operations disabled
   */
  const manualRetry = useCallback(async () => {
    try {
      // 🚨 DISABLED: Sync operations disabled for local-only operation
      return;
      
      /*
      // TODO: Uncomment for future sync implementation
      setIsRefreshing(true);
      const result = await triggerImmediateSync();
      await loadQueueStatus();
      return result;
      */
    } catch (error: any) {
      console.error('❌ Error during manual retry:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadQueueStatus]);

  // Network status effect
  useEffect(() => {
    const handleNetworkChange = () => {
      loadQueueStatus();
    };

    if (isConnected !== undefined) {
      handleNetworkChange();
    }
  }, [isConnected, loadQueueStatus]);

  /**
   * Polling disabled for local-only mode
   * 🚨 DISABLED: No polling needed for local-only operation
   */
  useEffect(() => {
    // 🚨 DISABLED: No polling needed for local-only operation
    
    /*
    // TODO: Uncomment for future sync implementation
    let interval: NodeJS.Timeout | null = null;
    
    const shouldPoll = (syncState === 'syncing' && isConnected) || 
                      queueStatus.pending > 0 || 
                      queueStatus.failed > 0;
    
    if (shouldPoll) {
      interval = setInterval(() => {
        if (!isRefreshing) { // Avoid overlapping requests
          loadQueueStatus();
        }
      }, 2000); // Poll every 2 seconds for more responsive UI
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    */
  }, []);

  // Load initial status on mount
  useEffect(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  return {
    syncState,
    queueStatus,
    lastSyncTime,
    isConnected,
    manualRetry,
    refreshStatus: loadQueueStatus,
  };
}; 