import { ThemeType } from '../../domain/types/theme/theme';
export const getColors = (theme: ThemeType) => {
  return {
    background: theme === 'dark' ? '#000000' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
  };
};
