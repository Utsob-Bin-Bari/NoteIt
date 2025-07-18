import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

const SignUpScreen = () => {
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
    return (
        <View style={GlobalStyles.container}>
            <Text>Sign Up Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignUpScreen;