import StackNavigator from './src/presentation/navigation/stacks/StackNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AppProvider, AppContext } from './src/application/context/AppContext';
import { useContext } from 'react';
import { getColors } from './src/presentation/constants/Colors';
import { ThemeType } from './src/domain/types/Theme';
import { enableScreens } from 'react-native-screens';

enableScreens();

const AppContent = () => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  return (
    <NavigationContainer>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={getColors(theme).background} />
      <StackNavigator />
    </NavigationContainer>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
