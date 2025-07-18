import StackNavigator from './src/presentation/navigation/stacks/StackNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle={'dark-content'} />
      <StackNavigator />
    </NavigationContainer>
  );
}
export default App;
