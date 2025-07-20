import { View, Text, TouchableOpacity } from 'react-native';
import React,{useContext} from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../../application/context/AppContext';
import { GlobalStyles } from '../styles/GlobalStyles';
import { ThemeType } from '../../domain/types/Theme/theme';

const LoginScreen = () => {
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
    const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
    return (
        <View style={GlobalStyles(theme).container}>
            <Text style={GlobalStyles(theme).text}>Login Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={GlobalStyles(theme).text}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={GlobalStyles(theme).text}>Home</Text>
            </TouchableOpacity>
            <Text style={GlobalStyles(theme).text}>{theme}</Text>
            <TouchableOpacity onPress={toggleTheme}>
                <Text style={GlobalStyles(theme).text}>Toggle Theme</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;