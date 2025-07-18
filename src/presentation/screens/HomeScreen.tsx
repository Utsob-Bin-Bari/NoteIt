import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

const HomeScreen = () => {
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
    return (
        <View style={GlobalStyles.container}>
            <Text>Home Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Note')}>
                <Text>Note</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;