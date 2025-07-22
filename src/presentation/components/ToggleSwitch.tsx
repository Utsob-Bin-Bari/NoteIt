import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { GlobalStyles } from '../styles/GlobalStyles';

interface ToggleSwitchProps {
  leftOption: string;
  rightOption: string;
  isRightSelected: boolean;
  onToggle: (isRightSelected: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  leftOption, 
  rightOption, 
  isRightSelected, 
  onToggle 
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);

  return (
    <View style={GlobalStyles(theme).toggleContainer}>
      <TouchableOpacity 
        style={[
          GlobalStyles(theme).toggleOption,
          { backgroundColor: !isRightSelected ? colors.primary : colors.background }
        ]}
        onPress={() => onToggle(false)}
      >
        <Text style={[
          GlobalStyles(theme).toggleText,
          { color: !isRightSelected ? colors.buttonText : colors.text }
        ]}>
          {leftOption}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          GlobalStyles(theme).toggleOption,
          { backgroundColor: isRightSelected ? colors.primary : colors.background }
        ]}
        onPress={() => onToggle(true)}
      >
        <Text style={[
          GlobalStyles(theme).toggleText,
          { color: isRightSelected ? colors.buttonText : colors.text }
        ]}>
          {rightOption}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ToggleSwitch; 