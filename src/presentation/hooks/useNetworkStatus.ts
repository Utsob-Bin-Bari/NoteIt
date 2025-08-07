import { useState, useEffect } from 'react';
import { NetworkService } from '../../infrastructure/utils/NetworkService';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial network state
    const getInitialState = async () => {
      try {
        const networkState = await NetworkService.getCurrentNetworkState();
        setIsConnected(networkState.isConnected ?? false);
      } catch (error) {
        console.log('Failed to get initial network state:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialState();

    // Subscribe to network changes
    const unsubscribe = NetworkService.subscribeToNetworkState((connected) => {
      setIsConnected(connected);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    isLoading,
  };
}; 