import React from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/theme/theme';
import { SunIcon, MoonIcon, PlusIcon, SettingsIcon } from '../components/icons';
import SyncStatusIcon from '../components/SyncStatusIcon';

export const getCustomHeaderStyle = (theme: ThemeType) => ({
  backgroundColor: getColors(theme).background,
});

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
      React.createElement(SyncStatusIcon, { 
        key: 'sync',
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

const createHomeHeaderLeft = (theme: ThemeType, onLogout: () => void, onSettings: () => void, isLoggingOut: boolean = false) => {
  const colors = getColors(theme);
  
  return () => 
    React.createElement(View, {
      style: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginLeft: 16
      }
    }, [
      React.createElement(TouchableOpacity, {
        key: 'logout',
        onPress: onLogout,
        disabled: isLoggingOut,
        style: { 
          paddingHorizontal: 12, 
          paddingVertical: 8, 
          backgroundColor: colors.error, 
          borderRadius: 6,
          opacity: isLoggingOut ? 0.6 : 1
        }
      }, 
        React.createElement(Text, {
          style: { 
            color: '#FFFFFF', 
            fontSize: 14, 
            fontWeight: '600' 
          }
        }, isLoggingOut ? 'Logging out...' : 'Logout')
      ),
      React.createElement(TouchableOpacity, {
        key: 'settings',
        onPress: onSettings,
        style: { 
          padding: 8, 
          marginLeft: 12 
        }
      }, 
        React.createElement(SettingsIcon, { 
          color: colors.primary, 
          width: 28, 
          height: 28 
        })
      )
    ]);
};

const createHomeHeaderRight = (theme: ThemeType, toggleTheme: () => void, onAddNote: () => void) => {
  const colors = getColors(theme);
  
  return () => 
    React.createElement(View, {
      style: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginRight: 16
      }
    }, [
      React.createElement(SyncStatusIcon, { 
        key: 'sync',
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
      ),
      React.createElement(TouchableOpacity, {
        key: 'add-note',
        onPress: onAddNote,
        style: { padding: 8, marginLeft: 0 }
      }, 
        React.createElement(PlusIcon, { color: colors.primary, width: 24, height: 24 })
      )
    ]);
};

const createNoteHeaderLeft = (theme: ThemeType, onSettings: () => void, navigation: any) => {
  const colors = getColors(theme);
  
  return () => 
    React.createElement(View, {
      style: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginLeft: 15,
      }
    }, [
      React.createElement(TouchableOpacity, {
        key: 'back',
        onPress: () => navigation.goBack(),
        style: { 
          minWidth: 20,
          minHeight: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }
      }, 
        React.createElement(Text, {
          style: { 
            color: colors.primary, 
            fontSize: 28,
            fontWeight: '600'
          }
        }, '←')
      ),
      React.createElement(TouchableOpacity, {
        key: 'settings',
        onPress: onSettings,
        style: { 
          padding: 8, 
        }
      }, 
        React.createElement(SettingsIcon, { 
          color: colors.primary, 
          width: 28, 
          height: 28 
        })
      )
    ]);
};

export const getHeaderOptions = (theme: ThemeType, toggleTheme: () => void, onSettings?: () => void, navigation?: any) => {
  const colors = getColors(theme);
  
  return {
    headerStyle: {
      ...getCustomHeaderStyle(theme),
      borderBottomColor: colors.text,
      borderBottomWidth: 1,
      height: Platform.OS === 'ios' ? 54 : 106,
    },
    headerTintColor: colors.primary,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 24,
      color: colors.text,
    },
    headerTitleAlign: 'center' as const,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    gestureEnabled: true,
    headerLeft: onSettings && navigation ? createNoteHeaderLeft(theme, onSettings, navigation) : undefined,
    headerRight: createHeaderRight(theme, toggleTheme),
  };
};

export const getHomeHeaderOptions = (theme: ThemeType, toggleTheme: () => void, onLogout: () => void, onAddNote: () => void, onSettings: () => void, isLoggingOut: boolean = false) => {
  const colors = getColors(theme);
  
  return {
    headerStyle: {
      ...getCustomHeaderStyle(theme),
      borderBottomColor: colors.text, 
      borderBottomWidth: 1,
      height: Platform.OS === 'ios' ? 54 : 106,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 24,
    },
    headerTitleAlign: 'center' as const,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    gestureEnabled: false, // Disable back gesture on home screen
    headerLeft: createHomeHeaderLeft(theme, onLogout, onSettings, isLoggingOut), // Logout button and settings icon on left
    headerRight: createHomeHeaderRight(theme, toggleTheme, onAddNote), // Sync status, plus icon, and theme toggle on right
  };
};

// New header options for Settings and Sync Management pages - platform-specific back button only
export const getSimpleHeaderOptions = (theme: ThemeType, toggleTheme: () => void) => {
  const colors = getColors(theme);
  
  return {
    headerStyle: {
      ...getCustomHeaderStyle(theme),
      borderBottomColor: colors.text,
      borderBottomWidth: 1,
      height: Platform.OS === 'ios' ? 54 : 106,
    },
    headerTintColor: colors.primary,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 24,
      color: colors.text,
    },
    headerTitleAlign: 'center' as const,
    headerBackTitleVisible: false,
    headerBackTitle: '',
    gestureEnabled: true,
    // Use platform-specific back button (no custom headerLeft)
    headerLeft: undefined,
    headerRight: createHeaderRight(theme, toggleTheme),
  };
};


