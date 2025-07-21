import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../../screens/LoginScreen';
import HomeScreen from '../../screens/HomeScreen';
import NoteScreen from '../../screens/NoteScreen';
import SignUpScreen from '../../screens/SignUpScreen';
import { StackNavigatorParamList } from '../types/StackNavigator';
import { ThemeType } from '../../../domain/types/theme/theme';
import { useContext } from 'react';
import { AppContext } from '../../../application/context/AppContext';
import { getHeaderOptions } from '../../styles/CustomHeaderStyle';

const Stack = createStackNavigator<StackNavigatorParamList>();

interface StackNavigatorProps {
  isLoggedIn?: boolean;
}

const StackNavigator = ({ isLoggedIn = false }: StackNavigatorProps) => {
    const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
    const headerOptions = getHeaderOptions(theme, toggleTheme);
    
    // Determine initial route based on login status
    const initialRouteName = isLoggedIn ? 'Home' : 'Login';
    
    console.log('StackNavigator initializing with route:', initialRouteName);
    
    return (
        <Stack.Navigator initialRouteName={initialRouteName}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }}/>
            <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={({ navigation }) => ({
                    ...headerOptions,
                    title: 'NoteIt',
                    headerLeft: () => null, // Remove back button
                    gestureEnabled: false, // Disable back gesture
                })}
            />
            <Stack.Screen name="Note" component={NoteScreen} options={headerOptions} />
        </Stack.Navigator>
    );
};

export default StackNavigator;