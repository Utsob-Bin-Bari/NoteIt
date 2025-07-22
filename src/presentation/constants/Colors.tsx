import { ThemeType } from '../../domain/types/theme/theme';

export const getColors = (theme: ThemeType) => {
  return {
    background: theme === 'dark' ? '#000000' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: theme === 'dark' ? '#B0B0B0' : '#6B7280',
    primary: theme === 'dark' ? '#FF6B35' : '#FF4500',
    secondary: theme === 'dark' ? '#2D2D2D' : '#F5F5F5',
    border: theme === 'dark' ? '#404040' : '#E5E5E5',
    placeholder: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(17, 24, 39, 0.6)',
    buttonText: theme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    inputBackground: theme === 'dark' ? '#1A1A1A' : '#FFFFFF',
    iconGrey: theme === 'dark' ? '#B0B0B0' : '#6B7280',
    networkConnected: theme === 'dark' ? '#4A9EFF' : '#007AFF',
    error: theme === 'dark' ? '#FF453A' : '#FF3B30',
    success: theme === 'dark' ? '#30D158' : '#34C759',
    warning: theme === 'dark' ? '#FF9F0A' : '#FF8C00',
  };
};
