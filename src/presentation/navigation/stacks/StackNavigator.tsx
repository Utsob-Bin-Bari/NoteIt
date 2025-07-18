import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../../screens/LoginScreen';
import HomeScreen from '../../screens/HomeScreen';
import NoteScreen from '../../screens/NoteScreen';
import SignUpScreen from '../../screens/SignUpScreen';
import { StackNavigatorParamList } from '../types/StackNavigator';

const Stack = createStackNavigator<StackNavigatorParamList>();

const StackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Note" component={NoteScreen} />
            <Stack.Screen 
                name="SignUp" 
                component={SignUpScreen} 
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;