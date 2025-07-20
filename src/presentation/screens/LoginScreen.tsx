import React, { useContext } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { GlobalStyles } from '../styles/GlobalStyles';
import { ThemeType } from '../../domain/types/theme/theme';
import { useLogin } from '../hooks/useLogin';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { getColors } from '../constants/Colors';
import { EyeIcon, EyeOffIcon, SunIcon, MoonIcon, WiFiOnlineIcon, WiFiOfflineIcon } from '../components/icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const LoginScreen = () => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  const { isConnected } = useNetworkStatus();
  
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errors,
    handleLogin,
    navigateToSignup,
    showPassword,
    setShowPassword,
  } = useLogin();

  return (
    <View style={GlobalStyles(theme).mainContainer}>
      <View style={[GlobalStyles(theme).container,{paddingTop:Platform.OS === 'android' ? 72 : 20}]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={GlobalStyles(theme).titleText}>
              Login
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isConnected ? 
                <WiFiOnlineIcon color={colors.networkConnected} width={20} height={20} /> : 
                <WiFiOfflineIcon color={colors.iconGrey} width={20} height={20} />
              }
              <TouchableOpacity 
                onPress={toggleTheme}
                style={{ padding: 8, marginLeft: 12 }}
              >
                {theme === 'light' ? 
                  <MoonIcon color={colors.primary} width={24} height={24} /> : 
                  <SunIcon color={colors.primary} width={24} height={24} />
                }
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[GlobalStyles(theme).mediumText,{marginBottom:20,textAlign:'left'}]}>Welcome to <Text style={GlobalStyles(theme).primaryText}>NoteIt </Text>! Please enter your login details.</Text>

          <CustomTextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{width:'100%'}}
          />
          <View style={{ position: 'relative' }}>
            <CustomTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={{ position: 'absolute', right: 16, top: 18 }}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeIcon color={colors.iconGrey} width={20} height={22}/> : <EyeOffIcon color={colors.iconGrey} width={20} height={22}/>}
            </TouchableOpacity>
          </View>

          <CustomButton
            text={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={loading}
          />

          <View style={[GlobalStyles(theme).rowContainer,{marginBottom:10}]}>
          <Text style={GlobalStyles(theme).mediumText}>Don't have an account?</Text>
            <TouchableOpacity onPress={navigateToSignup}>
                <Text style={GlobalStyles(theme).linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default LoginScreen;