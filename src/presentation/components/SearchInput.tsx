import React, { useContext } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { SearchIcon, FilterIcon } from './icons';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isFilterActive?: boolean;
  onFilterPress?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Search notes by title",
  isFilterActive = false,
  onFilterPress
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);

  return (
    <View style={{
      flexDirection: 'row',
      width: '100%',
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Search Icon - Left Side */}
      <View
        style={{
          width: 50,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRightWidth: 1,
          borderRightColor: colors.border,
        }}
      >
        <SearchIcon width={20} height={20} />
      </View>
      
      {/* Text Input */}
      <TextInput
        style={{
          flex: 1,
          height: 40,
          paddingHorizontal: 16,
          fontSize: 16,
          color: colors.text,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
        blurOnSubmit={true}
      />
      
      {/* Filter Icon - Right Side */}
      <TouchableOpacity
        onPress={onFilterPress}
        style={{
          width: 50,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          backgroundColor: isFilterActive ? colors.primary + '20' : 'transparent',
        }}
      >
        <FilterIcon 
          width={20} 
          height={20} 
          color={isFilterActive ? colors.primary : colors.iconGrey}
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput; 