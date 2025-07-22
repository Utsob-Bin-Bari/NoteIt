import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { GlobalStyles } from '../styles/GlobalStyles';
import { getColors } from '../constants/Colors';
import { useAppInitialization } from '../hooks/useAppInitialization';
import StackNavigator from '../navigation/stacks/StackNavigator';
import CustomButton from './CustomButton';

const AppInitializer = () => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const {
    isInitialized,
    isLoading,
    error,
    autoRecovery,
    recoveryReason,
  } = useAppInitialization();

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <View style={[GlobalStyles(theme).mainContainer, { justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[GlobalStyles(theme).text, { marginTop: 20, textAlign: 'center' }]}>
            Initializing App...
          </Text>
        </View>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <View style={[GlobalStyles(theme).mainContainer, { justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={[GlobalStyles(theme).text, { fontSize: 18, marginBottom: 10, textAlign: 'center' }]}>
            Initialization Failed
          </Text>
          <Text style={[GlobalStyles(theme).text, { marginBottom: 20, textAlign: 'center' }]}>
            {error}
          </Text>
          <CustomButton
            text="Retry"
            onPress={() => {
              // You can add retry logic here if needed
            }}
          />
        </View>
      </View>
    );
  }

  // App is initialized, show the main stack navigator
  return (
    <StackNavigator 
      isLoggedIn={isInitialized}
      autoRecoveryNavigation={autoRecovery ? {
        shouldNavigate: true,
        reason: recoveryReason
      } : null}
    />
  );
};

export default AppInitializer; 