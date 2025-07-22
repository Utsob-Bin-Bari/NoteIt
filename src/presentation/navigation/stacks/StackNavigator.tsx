import { createStackNavigator } from '@react-navigation/stack';
import { useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginScreen from '../../screens/LoginScreen';
import HomeScreen from '../../screens/HomeScreen';
import NoteScreen from '../../screens/NoteScreen';
import SignUpScreen from '../../screens/SignUpScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import SyncManagementScreen from '../../screens/SyncManagementScreen';
import { StackNavigatorParamList } from '../types/StackNavigator';
import { ThemeType } from '../../../domain/types/theme/theme';
import { AppContext } from '../../../application/context/AppContext';
import { getHeaderOptions, getHomeHeaderOptions } from '../../styles/CustomHeaderStyle';

const Stack = createStackNavigator<StackNavigatorParamList>();

interface StackNavigatorProps {
  isLoggedIn?: boolean;
  autoRecoveryNavigation?: {
    shouldNavigate: boolean;
    reason: string;
  } | null;
}

// Create a component to handle navigation within the stack
const NavigationHandler = ({ autoRecoveryNavigation, isLoggedIn }: { 
    autoRecoveryNavigation: { shouldNavigate: boolean; reason: string; } | null, 
    isLoggedIn: boolean 
}) => {
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (autoRecoveryNavigation?.shouldNavigate && isLoggedIn) {
            // Add a small delay to ensure navigation is ready
            setTimeout(() => {
                Alert.alert(
                    'Auto Recovery Detected',
                    `${autoRecoveryNavigation.reason}\n\nWould you like to recover your data from the server?`,
                    [
                        {
                            text: 'Later',
                            style: 'cancel',
                        },
                        {
                            text: 'Recover Now',
                            onPress: () => {
                                navigation.navigate('Settings', { 
                                    autoRecovery: true,
                                    recoveryReason: autoRecoveryNavigation.reason 
                                });
                            },
                        },
                    ]
                );
            }, 1000);
        }
    }, [autoRecoveryNavigation, isLoggedIn, navigation]);

    return null; // This component doesn't render anything
};

const StackNavigator = ({ isLoggedIn = false, autoRecoveryNavigation = null }: StackNavigatorProps) => {
    const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
    const headerOptions = getHeaderOptions(theme, toggleTheme);
    const initialRouteName = isLoggedIn ? 'Home' : 'Login';
    
    return (
        <>
            <NavigationHandler 
                autoRecoveryNavigation={autoRecoveryNavigation} 
                isLoggedIn={isLoggedIn} 
            />
            <Stack.Navigator initialRouteName={initialRouteName}>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
                <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }}/>
                <Stack.Screen 
                    name="Home" 
                    component={HomeScreen} 
                    options={({ navigation }) => ({
                        ...headerOptions,
                        title: 'NoteIt',
                        headerLeft: () => null,
                        gestureEnabled: false, 
                    })}
                />
                <Stack.Screen 
                    name="Note" 
                    component={NoteScreen} 
                    options={({ navigation }) => ({
                        ...getHeaderOptions(theme, toggleTheme, () => {
                            navigation.navigate('Settings');
                        }, navigation),
                        title: 'Note',
                    })}
                />
                <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen} 
                    options={({ navigation }) => ({
                        ...getHeaderOptions(theme, toggleTheme, () => {
                        }, navigation),
                        title: 'Settings',
                    })}
                />
                <Stack.Screen 
                    name="SyncManagement" 
                    component={SyncManagementScreen} 
                    options={({ navigation }) => ({
                        ...getHeaderOptions(theme, toggleTheme, () => {
                        }, navigation),
                        title: 'Sync Management',
                    })}
                />
            </Stack.Navigator>
        </>
    );
};

export default StackNavigator;