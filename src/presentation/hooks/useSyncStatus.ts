import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncQueueService } from '../../application/services/notes/syncQueueService';
import { getSyncProcessorStatus, triggerImmediateSync } from '../../application/services/notes/syncProcessor';

type SyncState = 'offline' | 'syncing' | 'synced' | 'failed' | 'idle';

/**
 * Sync status hook for UI compatibility
 */
export const useSyncStatus = () => {
  const { isConnected } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [queueStatus, setQueueStatus] = useState<{pending: number, failed: number}>({ pending: 0, failed: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Load queue status
   */
  const loadQueueStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      const status = await syncQueueService.getQueueStatus();
      const processorStatus = getSyncProcessorStatus();
      
      setQueueStatus(status);
      
      if (!isConnected) {
        setSyncState('offline');
      } else {
        setSyncState('synced');
        setLastSyncTime(new Date());
      }
      
    } catch (error: any) {
      console.log('❌ Error loading network status:', error);
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

  const manualRetry = useCallback(async () => {
    try {
      return;
    } catch (error: any) {
      console.log('Error during manual retry:', error);
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