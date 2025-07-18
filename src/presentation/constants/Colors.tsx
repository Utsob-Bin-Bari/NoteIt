import { ThemeType } from '../../domain/types/Theme';
export const getColors = (theme: ThemeType) => {
  return {
    background: theme === 'dark' ? '#000000' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
  };
};
