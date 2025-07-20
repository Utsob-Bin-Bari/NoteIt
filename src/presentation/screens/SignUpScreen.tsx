import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity, KeyboardAvoidingView} from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { GlobalStyles } from '../styles/GlobalStyles';
import { ThemeType } from '../../domain/types/theme/theme';
import { useSignup } from '../hooks/useSignup';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { getColors } from '../constants/Colors';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const SignUpScreen = () => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const {
    loading,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    errors,
    handleSignup,
    navigateToLogin,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  } = useSignup();

  return (
    <View style={GlobalStyles(theme).mainContainer}>
      <View style={[GlobalStyles(theme).container,{paddingTop:Platform.OS === 'android' ? 72 : 20}]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={GlobalStyles(theme).titleText}>
          Sign Up
        </Text>
        <Text style={[GlobalStyles(theme).mediumText,{marginBottom:20,textAlign:'left'}]}>Welcome to <Text style={GlobalStyles(theme).primaryText}>NoteIt </Text>! Please enter your personal details to create an account.</Text>
        <CustomTextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <CustomTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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

        <View style={{ position: 'relative' }}>
          <CustomTextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={{ position: 'absolute', right: 16, top: 18 }}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeIcon color={colors.iconGrey} width={20} height={22}/> : <EyeOffIcon color={colors.iconGrey} width={20} height={22}/>}
          </TouchableOpacity>
        </View>

        {errors.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            {errors.map((error, index) => (
              <Text key={index} style={{ color: 'red', fontSize: 14, marginBottom: 5 }}>
                {error}
              </Text>
            ))}
          </View>
        )}

        <CustomButton
          text={loading ? 'Creating Account...' : 'Sign Up'}
          onPress={handleSignup}
          disabled={loading}
        />

        <View style={[GlobalStyles(theme).rowContainer,{marginBottom:10}]}>
          <Text style={GlobalStyles(theme).mediumText}>Don't have an account?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
                <Text style={GlobalStyles(theme).linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default SignUpScreen;