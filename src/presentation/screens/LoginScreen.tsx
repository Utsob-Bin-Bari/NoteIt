import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

const LoginScreen = () => {
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
    return (
        <View style={GlobalStyles.container}>
            <Text>Login Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text>Home</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;