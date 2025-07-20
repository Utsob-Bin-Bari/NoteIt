import React, { useContext } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { getColors } from '../constants/Colors';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';

interface CustomTextInputProps extends TextInputProps {
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ 
  value, 
  onChangeText, 
  placeholder, 
  style, 
  autoCorrect = false, 
  spellCheck = false, 
  secureTextEntry = false,
  ...props 
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  return (
    <TextInput
      style={[styles(colors).input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.primary}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      secureTextEntry={secureTextEntry}
      {...props} 
    />
  );
};

const styles = (colors: any) => StyleSheet.create({
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    paddingLeft: 16,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 10,
  },
});

export default CustomTextInput; 