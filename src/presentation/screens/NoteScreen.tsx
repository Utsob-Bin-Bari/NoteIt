import { View, Text } from 'react-native';
import React, { useContext } from 'react';
import { GlobalStyles } from '../styles/GlobalStyles';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/Theme';

const NoteScreen = () => {  
    const { theme } = useContext(AppContext) as { theme: ThemeType };
    return (
        <View style={GlobalStyles(theme).container}>
            <Text style={GlobalStyles(theme).text}>Note Screen</Text>
            <View style={GlobalStyles(theme).container}></View>
        </View>
    );
};

export default NoteScreen;