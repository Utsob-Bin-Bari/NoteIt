import { View, Text, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigatorParamList } from '../navigation/types/StackNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/Theme';

const HomeScreen = () => {
    const navigation = useNavigation<StackNavigationProp<StackNavigatorParamList>>();
const { theme } = useContext(AppContext) as { theme: ThemeType };
    return (
        <View style={GlobalStyles(theme).container}>
            <Text style={GlobalStyles(theme).text}>Home Screen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Note')}>
                <Text style={GlobalStyles(theme).text}>Note</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;