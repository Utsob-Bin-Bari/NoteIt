import React, { useContext } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, StyleProp, ViewStyle } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { SearchIcon, FilterIcon } from './icons';
import { GlobalStyles } from '../styles/GlobalStyles';

interface SearchInputProps {
  stylesProps?: StyleProp<ViewStyle>;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isFilterActive?: boolean;
  onFilterPress?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  stylesProps,
  value,
  onChangeText,
  placeholder = "Search notes by title",
  isFilterActive = false,
  onFilterPress
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);

  return (
    <View style={[GlobalStyles(theme).searchInputContainer,stylesProps]}>
      <View style={[GlobalStyles(theme).searchOrFilterIconContainer,{borderRightWidth:1,borderRightColor:colors.border}]}>
        <SearchIcon width={20} height={20} />
      </View>
      <TextInput
        style={GlobalStyles(theme).searchTextContainer}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        returnKeyType="search"
        onSubmitEditing={Keyboard.dismiss}
      />
      
      {/* Filter Icon - Right Side */}
      <TouchableOpacity
        onPress={onFilterPress}
        style={[GlobalStyles(theme).searchOrFilterIconContainer,{borderLeftWidth:1,borderLeftColor:colors.border,backgroundColor:isFilterActive ? colors.primary + '20' : 'transparent'}]}>
        <FilterIcon width={20} height={20} color={isFilterActive ? colors.primary : colors.iconGrey}/>
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput; 