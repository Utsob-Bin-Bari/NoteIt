import { View, Text, TouchableOpacity } from 'react-native';
import React, { useContext }     from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/Theme';

const SignUpScreen = () => {
    const { theme } = useContext(AppContext) as { theme: ThemeType };
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
    return (
        <View style={GlobalStyles(theme).container}>
            <Text style={GlobalStyles(theme).text}>Sign Up Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={GlobalStyles(theme).text}>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignUpScreen;