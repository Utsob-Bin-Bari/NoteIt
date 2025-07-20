import { ThemeType } from '../../domain/types/theme/theme';

export const getColors = (theme: ThemeType) => {
  return {
    background: theme === 'dark' ? '#000000' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    primary: theme === 'dark' ? '#FF6B35' : '#FF4500',
    secondary: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    border: theme === 'dark' ? '#404040' : '#E5E5E5',
    placeholder: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(17, 24, 39, 0.6)',
    buttonText: theme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    inputBackground: theme === 'dark' ? '#1A1A1A' : '#FFFFFF',
    iconGrey: theme === 'dark' ? '#B0B0B0' : '#6B7280',
  };
};
