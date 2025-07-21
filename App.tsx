import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, SafeAreaView } from 'react-native';
import { AppProvider, AppContext } from './src/application/context/AppContext';
import { useContext, useEffect, useRef } from 'react';
import { getColors } from './src/presentation/constants/Colors';
import { ThemeType } from './src/domain/types/theme/theme';
import { enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { store } from './src/application/store/store';
import navigationService from './src/infrastructure/utils/NavigationService';
import AppInitializer from './src/presentation/components/AppInitializer';

enableScreens();

const AppContent = () => {
  const navigationRef = useRef<any>(null);
  
  useEffect(() => {
    // Set navigation reference for navigation service
    navigationService.setNavigationRef(navigationRef);
  }, []);
  
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  
  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaView style={{flex:1,backgroundColor:getColors(theme).background}}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={getColors(theme).background}/>
      <AppInitializer />
      </SafeAreaView>
    </NavigationContainer>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Provider>
  );
}

export default App;
