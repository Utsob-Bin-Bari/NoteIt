import React, { useContext } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { GlobalStyles } from '../styles/GlobalStyles';
import { ThemeType } from '../../domain/types/theme/theme';
import { useLogin } from '../hooks/useLogin';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { getColors } from '../constants/Colors';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const LoginScreen = () => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  
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
          <Text style={GlobalStyles(theme).titleText}>
            Login
          </Text>
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

          <CustomButton
            text={`Theme: ${theme}`}
            onPress={toggleTheme}
            backgroundColor="transparent"
            textColor={colors.text}
            borderColor={colors.border}
            height={40}
          />
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default LoginScreen;