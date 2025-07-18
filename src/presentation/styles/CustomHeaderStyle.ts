import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/Theme';

export const getCustomHeaderStyle = (theme: ThemeType) => ({
  backgroundColor: getColors(theme).background,
});

export const getHeaderOptions = (theme: ThemeType) => ({
  headerStyle: getCustomHeaderStyle(theme),
  headerTintColor: getColors(theme).text,
});
