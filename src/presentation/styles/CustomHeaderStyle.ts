import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/theme/theme';

export const getCustomHeaderStyle = (theme: ThemeType) => ({
  backgroundColor: getColors(theme).background,
});

export const getHeaderOptions = (theme: ThemeType) => ({
  headerStyle: {
    ...getCustomHeaderStyle(theme),
    borderBottomColor: getColors(theme).text,
    borderBottomWidth: 1,
  },
  headerTintColor: getColors(theme).text,
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerTitleAlign: 'center',
  headerBackTitleVisible: false,
  headerBackTitle:false,
  gestureEnabled: true,
});


