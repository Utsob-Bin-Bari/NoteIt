import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { GlobalStyles } from '../styles/GlobalStyles';
import { getColors } from '../constants/Colors';
import { useAppInitialization } from '../hooks/useAppInitialization';
import CustomButton from './CustomButton';
import StackNavigator from '../navigation/stacks/StackNavigator';
import RecoveryScreen from './RecoveryScreen';

const AppInitializer = () => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const {
    isInitializing,
    isLoggedIn,
    initializationError,
    needsRecovery,
    recoveryReason,
    retryInitialization,
  } = useAppInitialization();

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <View style={[GlobalStyles(theme).mainContainer, { justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[GlobalStyles(theme).text, { marginTop: 20, fontSize: 16 }]}>
            Initializing NoteIt...
          </Text>
          <Text style={[GlobalStyles(theme).text, { marginTop: 8, fontSize: 14, opacity: 0.7 }]}>
            Setting up database and checking for existing session
          </Text>
        </View>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initializationError) {
    return (
      <View style={[GlobalStyles(theme).mainContainer, { justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
          <Text style={[GlobalStyles(theme).titleText, { marginBottom: 20 }]}>
            Initialization Failed
          </Text>
          <Text style={[GlobalStyles(theme).errorText, { textAlign: 'center', marginBottom: 30 }]}>
            {initializationError}
          </Text>
          <CustomButton
            text="Retry"
            onPress={retryInitialization}
          />
        </View>
      </View>
    );
  }

  // Show recovery screen if needed
  if (needsRecovery && isLoggedIn) {
    return (
      <RecoveryScreen
        reason={recoveryReason}
        onRecoveryComplete={() => {
          // Recovery completed, refresh app
          retryInitialization();
        }}
        onSkipRecovery={() => {
          // User chose to skip recovery, continue to app
          retryInitialization();
        }}
      />
    );
  }

  // Initialization completed successfully - show main app
  return <StackNavigator isLoggedIn={isLoggedIn} />;
};

export default AppInitializer; 