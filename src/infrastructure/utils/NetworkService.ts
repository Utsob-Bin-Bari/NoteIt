import NetInfo from '@react-native-community/netinfo';

export const NetworkService = {
  /**
   * Get current network state
   */
  getCurrentNetworkState: async () => {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };
    } catch (error) {
      console.log('Error fetching network state:', error);
      return {
        isConnected: false,
        type: null,
        isInternetReachable: false,
      };
    }
  },

  /**
   * Subscribe to network state changes
   */
  subscribeToNetworkState: (callback: (isConnected: boolean) => void) => {
    const unsubscribe = NetInfo.addEventListener(state => {
      callback(state.isConnected ?? false);
    });
    
    return unsubscribe;
  },

  /**
   * Check if device has internet access
   */
  checkInternetReachability: async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      return state.isInternetReachable ?? false;
    } catch (error) {
      return false;
    }
  }
}; 