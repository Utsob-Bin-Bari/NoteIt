import axios, { AxiosError } from 'axios';
import { Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StackNavigatorParamList } from '../../../presentation/navigation/types/StackNavigator';

// Create axios instance with interceptor
export const apiClient = axios.create();
const navigation = useNavigation<NavigationProp<StackNavigatorParamList>>();
// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Alert.alert(
        'Session Expired',
        'Login session expires. To Sync data please login again.',
        [
          {
            text: 'OK',
            onPress: () => {
                navigation.navigate('Login');
            },
          },
        ]
      );
    }
    return Promise.reject(error);
  }
);
