import React, { useContext } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { GlobalStyles } from '../styles/GlobalStyles';
import { getColors } from '../constants/Colors';
import { useRecovery } from '../hooks/useRecovery';
import CustomButton from './CustomButton';

interface RecoveryScreenProps {
  reason: string;
  onRecoveryComplete: () => void;
  onSkipRecovery: () => void;
}

const RecoveryScreen = ({ reason, onRecoveryComplete, onSkipRecovery }: RecoveryScreenProps) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const {
    isRecovering,
    progress,
    result,
    error,
    performRecovery,
  } = useRecovery();

  const handleStartRecovery = async () => {
    const success = await performRecovery();
    if (success) {
      onRecoveryComplete();
    }
  };

  if (isRecovering) {
    return (
      <ScrollView style={GlobalStyles(theme).mainContainer} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <View style={{ width: '80%', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[GlobalStyles(theme).titleText, { marginTop: 20 }]}>
            Restoring Your Data
          </Text>
          <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginTop: 10 }]}>
            {progress.step}
          </Text>
          <View style={{ 
            width: '100%', 
            height: 6, 
            backgroundColor: colors.inputBackground, 
            borderRadius: 3,
            marginTop: 20,
            overflow: 'hidden'
          }}>
            <View style={{
              width: `${(progress.current / progress.total) * 100}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: 3
            }} />
          </View>
          <Text style={[GlobalStyles(theme).text, { marginTop: 10, opacity: 0.7 }]}>
            {progress.current} of {progress.total} steps
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (result) {
    return (
      <ScrollView style={GlobalStyles(theme).mainContainer} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <View style={{ width: '80%', alignItems: 'center' }}>
          <Text style={[GlobalStyles(theme).titleText, { marginBottom: 20 }]}>
            Recovery Complete! ✅
          </Text>
          <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 20 }]}>
            Successfully restored your data from cloud backup:
          </Text>
          <View style={{ marginBottom: 30, width: '100%' }}>
            <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 5 }]}>
              📝 {result.ownNotes} your notes
            </Text>
            <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 5 }]}>
              🤝 {result.sharedNotes} shared with you
            </Text>
            <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 5 }]}>
              🔖 {result.bookmarkedNotes} bookmarked notes
            </Text>
          </View>
          <CustomButton
            text="Continue to App"
            onPress={onRecoveryComplete}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={GlobalStyles(theme).mainContainer} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <View style={{ width: '80%', alignItems: 'center' }}>
        <Text style={[GlobalStyles(theme).titleText, { marginBottom: 20 }]}>
          Data Recovery Available
        </Text>
        <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 20 }]}>
          {reason}
        </Text>
        <Text style={[GlobalStyles(theme).text, { textAlign: 'center', marginBottom: 30, opacity: 0.8 }]}>
          We can restore your notes from your cloud backup. This will not affect your current login session.
        </Text>
        
        {error ? (
          <Text style={[GlobalStyles(theme).errorText, { textAlign: 'center', marginBottom: 20 }]}>
            {error}
          </Text>
        ) : null}

        <View style={{ width: '100%', gap: 15 }}>
          <CustomButton
            text="Restore My Data"
            onPress={handleStartRecovery}
          />
          <CustomButton
            text="Skip Recovery"
            onPress={onSkipRecovery}
            backgroundColor={colors.inputBackground}
            textColor={colors.text}
            borderColor={colors.border}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default RecoveryScreen; 