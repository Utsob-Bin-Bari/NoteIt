import { StyleSheet } from 'react-native';
import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/Theme';
export const GlobalStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:getColors(theme).background,
    alignItems:'center',
    justifyContent:'center',
  },
  text:{
    color:getColors(theme).text,
  }
});
