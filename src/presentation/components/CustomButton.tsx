import React, { useContext } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getColors } from '../constants/Colors';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';

interface CustomButtonProps {
  text: string;
  onPress?: () => void;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  height?: number;
  opacity?: number;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  text, 
  onPress, 
  textColor,
  backgroundColor,
  borderColor,
  height = 56, 
  opacity = 1,
  disabled = false
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const finalTextColor = textColor || colors.buttonText;
  const finalBackgroundColor = backgroundColor || colors.primary;
  const finalBorderColor = borderColor || colors.primary;

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        {
          opacity: disabled ? 0.5 : opacity,
          height: height,
          backgroundColor: finalBackgroundColor,
          borderColor: finalBorderColor,
        }
      ]} 
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <Text style={[styles.text, { color: finalTextColor }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width:'100%',
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomButton; 