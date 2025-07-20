import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../../screens/LoginScreen';
import HomeScreen from '../../screens/HomeScreen';
import NoteScreen from '../../screens/NoteScreen';
import SignUpScreen from '../../screens/SignUpScreen';
import { StackNavigatorParamList } from '../types/StackNavigator';
import { ThemeType } from '../../../domain/types/Theme/theme';
import { useContext } from 'react';
import { AppContext } from '../../../application/context/AppContext';
import { getHeaderOptions } from '../../styles/CustomHeaderStyle';

const Stack = createStackNavigator<StackNavigatorParamList>();

const StackNavigator = () => {
    const { theme } = useContext(AppContext) as { theme: ThemeType };
    const headerOptions = getHeaderOptions(theme);
    
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="Home" component={HomeScreen} options={headerOptions} />
            <Stack.Screen name="Note" component={NoteScreen} options={headerOptions} />
        </Stack.Navigator>
    );
};

export default StackNavigator;