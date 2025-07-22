import React, { useContext, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { GlobalStyles } from '../styles/GlobalStyles';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { useSettings } from '../hooks/useSettings';
import { getColors } from '../constants/Colors';
import { getSimpleHeaderOptions } from '../styles/CustomHeaderStyle';
import { BinIcon, HardDriveIcon, SyncIcon, CheckIcon } from '../components/icons';

const SettingsScreen = ({ navigation, route }: any) => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  
  const autoRecovery = route?.params?.autoRecovery || false;
  const recoveryReason = route?.params?.recoveryReason || '';
  
  const {
    loading,
    error,
    clearDataState,
    recoverDataState,
    handleClearData,
    handleRecoverData,
    handleSyncManagement,
  } = useSettings({ autoRecovery, recoveryReason });

  const clearDataRotateValue = useRef(new Animated.Value(0)).current;
  const recoverDataRotateValue = useRef(new Animated.Value(0)).current;

  // Clear Data rotation animation
  useEffect(() => {
    if (clearDataState === 'loading') {
      const rotateAnimation = Animated.loop(
        Animated.timing(clearDataRotateValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      clearDataRotateValue.setValue(0);
    }
  }, [clearDataState]);

  // Recover Data rotation animation
  useEffect(() => {
    if (recoverDataState === 'loading') {
      const rotateAnimation = Animated.loop(
        Animated.timing(recoverDataRotateValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      recoverDataRotateValue.setValue(0);
    }
  }, [recoverDataState]);

  const clearDataRotate = clearDataRotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const recoverDataRotate = recoverDataRotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderRightIcon = (state: 'idle' | 'loading' | 'completed' | 'failed', rotateValue: Animated.AnimatedAddition<string>) => {
    if (state === 'loading') {
      return (
        <Animated.View style={{ transform: [{ rotate: rotateValue }] }}>
          <SyncIcon color={colors.warning} width={20} height={20} />
        </Animated.View>
      );
    } else if (state === 'completed') {
      return <CheckIcon color={colors.success} width={20} height={20} />;
    } else if (state === 'failed') {
      return <SyncIcon color={colors.error} width={20} height={20} />;
    }
    return null;
  };

  useLayoutEffect(() => {
    const headerOptions = getSimpleHeaderOptions(theme, toggleTheme);
    navigation.setOptions({
      ...headerOptions,
      title: 'Settings',
    });
  }, [navigation, theme, toggleTheme]);

  return (
    <View style={GlobalStyles(theme).mainContainer}>
      <View style={[GlobalStyles(theme).container, { width: '90%', alignSelf: 'center'}]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <TouchableOpacity 
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleClearData}
          disabled={clearDataState === 'loading'}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <BinIcon color={colors.error} width={24} height={24} />
              <Text style={[
                GlobalStyles(theme).text,
                {
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.error,
                  marginLeft: 12,
                }
              ]}>
                Clear Data
              </Text>
            </View>
            {renderRightIcon(clearDataState, clearDataRotate)}
          </View>
          
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 16,
              color: colors.text,
              lineHeight: 24,
              opacity: 0.8,
            }
          ]}>
            Permanently removes all notes, bookmarks, sync operations, and user-specific settings from your device. Your login session and system settings will be preserved. Any unsynced data will be lost forever.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleRecoverData}
          disabled={recoverDataState === 'loading'}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <HardDriveIcon color={colors.primary} width={24} height={24} />
              <Text style={[
                GlobalStyles(theme).text,
                {
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.primary,
                  marginLeft: 12,
                }
              ]}>
                Recover Data
              </Text>
            </View>
            {renderRightIcon(recoverDataState, recoverDataRotate)}
          </View>
          
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 16,
              color: colors.text,
              lineHeight: 24,
              opacity: 0.8,
            }
          ]}>
            It will recover data from server and overwrite your local storage. Any unsync data will be lost forever.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleSyncManagement}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <SyncIcon color={colors.success} width={24} height={24} />
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 18,
                fontWeight: '600',
                color: colors.success,
                marginLeft: 12,
              }
            ]}>
              Sync Management
            </Text>
          </View>
          
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 16,
              color: colors.text,
              lineHeight: 24,
              opacity: 0.8,
            }
          ]}>
            You can manually sync data or delete sync operation from here.
          </Text>
        </TouchableOpacity>

        {error ? (
          <Text style={[GlobalStyles(theme).errorText, { marginTop: 10, textAlign: 'center' }]}>
            {error}
          </Text>
        ) : null}

        <View style={{ height: 50 }} />
      </ScrollView>
      </View>
    </View>
  );
};

export default SettingsScreen; 