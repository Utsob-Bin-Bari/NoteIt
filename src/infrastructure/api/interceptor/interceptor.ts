import axios, { AxiosError } from 'axios';
import { Alert } from 'react-native';
import navigationService from '../../utils/NavigationService';

// Create axios instance with interceptor
export const apiClient = axios.create();

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if (!isAuthRequest) {
        Alert.alert(
          'Session Expired',
          'Login session expires. To sync data please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigationService.navigate('Login');
              },
            },
          ]
        );
      }
    }
    return Promise.reject(error);
  }
);
