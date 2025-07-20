import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/theme/theme';
import { SunIcon, MoonIcon, WiFiOnlineIcon, WiFiOfflineIcon } from '../components/icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const getCustomHeaderStyle = (theme: ThemeType) => ({
  backgroundColor: getColors(theme).background,
});

const NetworkStatusIcon = ({ theme }: { theme: ThemeType }) => {
  const { isConnected } = useNetworkStatus();
  const colors = getColors(theme);
  
  return React.createElement(
    isConnected ? WiFiOnlineIcon : WiFiOfflineIcon,
    { 
      color: isConnected ? colors.networkConnected : colors.iconGrey, 
      width: 20, 
      height: 20 
    }
  );
};

const createHeaderRight = (theme: ThemeType, toggleTheme: () => void) => {
  const colors = getColors(theme);
  
  return () => 
    React.createElement(View, {
      style: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginRight: 16
      }
    }, [
      React.createElement(NetworkStatusIcon, { 
        key: 'network',
        theme 
      }),
      React.createElement(TouchableOpacity, {
        key: 'theme-toggle',
        onPress: toggleTheme,
        style: { padding: 8, marginLeft: 12 }
      }, 
        theme === 'light' ? 
          React.createElement(MoonIcon, { color: colors.primary, width: 24, height: 24 }) : 
          React.createElement(SunIcon, { color: colors.primary, width: 24, height: 24 })
      )
    ]);
};

export const getHeaderOptions = (theme: ThemeType, toggleTheme: () => void) => {
  const colors = getColors(theme);
  
  return {
    headerStyle: {
      ...getCustomHeaderStyle(theme),
      borderBottomColor: colors.text,
      borderBottomWidth: 1,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
    },
    headerTitleAlign: 'center' as const,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    gestureEnabled: true,
    headerRight: createHeaderRight(theme, toggleTheme),
  };
};


