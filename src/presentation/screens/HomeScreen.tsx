import React, { useContext, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { GlobalStyles } from '../styles/GlobalStyles';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { useHome } from '../hooks/useHome';
import { getColors } from '../constants/Colors';
import { getHomeHeaderOptions } from '../styles/CustomHeaderStyle';
import CustomButton from '../components/CustomButton';

const HomeScreen = ({ navigation }: any) => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  
  const {
    reduxUserData,
    localUserData,
    isLoggedIn,
    loading,
    error,
    loggingOut,
    navigateToNote,
    refreshUserData,
    handleLogout,
  } = useHome();

  // Set up custom header with logout button
  useLayoutEffect(() => {
    const headerOptions = getHomeHeaderOptions(theme, toggleTheme, handleLogout, loggingOut);
    navigation.setOptions(headerOptions);
  }, [navigation, theme, toggleTheme, handleLogout, loggingOut]);

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string | undefined | null) => {
    if (!timestamp) return 'Not set';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Helper function to format token display
  const formatToken = (token: string | undefined) => {
    if (!token) return 'No token';
    if (token.length > 20) {
      return `${token.substring(0, 8)}...${token.slice(-8)} (${token.length} chars)`;
    }
    return `***${token.slice(-4)} (${token.length} chars)`;
  };

  if (loading) {
    return (
      <SafeAreaView style={GlobalStyles(theme).mainContainer}>
        <View style={[GlobalStyles(theme).container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[GlobalStyles(theme).text, { marginTop: 10 }]}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={GlobalStyles(theme).mainContainer}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 20 }}>
        <View style={{ width: '90%' }}>
          
          {/* Welcome Header */}
          <View style={{ marginBottom: 30 }}>
            <Text style={GlobalStyles(theme).titleText}>
              Welcome to NoteIt
            </Text>
            <Text style={[GlobalStyles(theme).mediumText, { marginTop: 10, textAlign: 'left' }]}>
              {isLoggedIn ? `Hello, ${reduxUserData?.name || localUserData?.name || 'User'}!` : 'Please log in to continue'}
            </Text>
          </View>

          {/* Redux User Data Section */}
          <View style={{ 
            backgroundColor: colors.secondary, 
            padding: 16, 
            borderRadius: 10, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border 
          }}>
            <Text style={[GlobalStyles(theme).primaryText, { marginBottom: 10 }]}>
              Redux Store Data
            </Text>
            {reduxUserData?.id ? (
              <>
                <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                  User ID: {reduxUserData.id}
                </Text>
                <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                  Email: {reduxUserData.email}
                </Text>
                <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                  Name: {reduxUserData.name}
                </Text>
                <Text style={[GlobalStyles(theme).text, { fontSize: 14 }]}>
                  Access Token: {formatToken(reduxUserData.accessToken)}
                </Text>
              </>
            ) : (
              <Text style={[GlobalStyles(theme).text, { fontSize: 14, fontStyle: 'italic' }]}>
                No user data in Redux store
              </Text>
            )}
          </View>

          {/* Complete Local SQLite Data Section */}
          <View style={{ 
            backgroundColor: colors.secondary, 
            padding: 16, 
            borderRadius: 10, 
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border 
          }}>
            <Text style={[GlobalStyles(theme).primaryText, { marginBottom: 10 }]}>
              Complete Local SQLite Data
            </Text>
            {localUserData?.id ? (
              <>
                <View style={{ marginBottom: 15 }}>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 16, fontWeight: '600', marginBottom: 8 }]}>
                    User Information
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    User ID: {localUserData.id}
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Email: {localUserData.email}
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Full Name: {localUserData.name}
                  </Text>
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 16, fontWeight: '600', marginBottom: 8 }]}>
                    Authentication
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Access Token: {formatToken(localUserData.accessToken)}
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Token Length: {localUserData.accessToken?.length || 0} characters
                  </Text>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 16, fontWeight: '600', marginBottom: 8 }]}>
                    Session Timestamps
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Created At: {formatTimestamp(localUserData.createdAt)}
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Updated At: {formatTimestamp(localUserData.updatedAt)}
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 14, marginBottom: 5 }]}>
                    Last Sync At: {formatTimestamp(localUserData.lastSyncAt)}
                  </Text>
                </View>

                <View style={{ 
                  backgroundColor: colors.inputBackground, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 13, fontWeight: '500', marginBottom: 5 }]}>
                    Database Record ID: 1 (Primary Session)
                  </Text>
                  <Text style={[GlobalStyles(theme).text, { fontSize: 13, opacity: 0.8 }]}>
                    Storage: SQLite Local Database
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={[GlobalStyles(theme).text, { fontSize: 14, fontStyle: 'italic', textAlign: 'center' }]}>
                  No user session found in local SQLite storage
                </Text>
                <Text style={[GlobalStyles(theme).text, { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 5 }]}>
                  User needs to log in to create a session
                </Text>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={[GlobalStyles(theme).errorText, { fontSize: 14, textAlign: 'center' }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={{ marginBottom: 20 }}>
            <CustomButton
              text="Refresh User Data"
              onPress={refreshUserData}
              disabled={loggingOut}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity 
              onPress={navigateToNote}
              disabled={loggingOut}
              style={{
                backgroundColor: loggingOut ? colors.secondary : colors.inputBackground,
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                opacity: loggingOut ? 0.6 : 1
              }}
            >
              <Text style={[GlobalStyles(theme).text, { fontSize: 16, fontWeight: '500' }]}>
                Go to Notes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          <View style={{ 
            backgroundColor: isLoggedIn ? colors.networkConnected : colors.error, 
            padding: 12, 
            borderRadius: 8, 
            alignItems: 'center' 
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              Status: {loggingOut ? 'Logging out...' : isLoggedIn ? 'Logged In' : 'Not Logged In'}
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;