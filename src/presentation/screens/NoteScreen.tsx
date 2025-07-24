import React, { useContext, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform 
} from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { GlobalStyles } from '../styles/GlobalStyles';
import { getColors } from '../constants/Colors';
import { getHeaderOptions } from '../styles/CustomHeaderStyle';
import { useNoteEditor } from '../hooks/useNoteEditor';
import CustomButton from '../components/CustomButton';

const NoteScreen = ({ navigation }: any) => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  
  const {
    title,
    details,
    noteTitle,
    loading,
    saving,
    error,
    hasChanges,
    isNewNote,
    setTitle,
    setDetails,
    handleSave,
    handleSettings,
    handleGoBack,
  } = useNoteEditor();

  // Handle save with navigation back to home
  const handleSaveAndNavigate = async () => {
    const result = await handleSave();
    if (result) {
      // Navigate back to home screen after successful save
      navigation.navigate('Home');
    }
  };

  // Set up header without save button
  useLayoutEffect(() => {
    const headerOptions = getHeaderOptions(theme, toggleTheme, handleSettings, navigation);
    
    navigation.setOptions({
      ...headerOptions,
      title: noteTitle,
      // Override back button to handle unsaved changes
      headerLeft: () => 
        React.createElement(View, {
          style: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginLeft: 15,
          }
        }, [
          React.createElement(TouchableOpacity, {
            key: 'back',
            onPress: handleGoBack,
            style: { 
              minWidth: Platform.OS === 'android' ? 40 : 20,
              minHeight: Platform.OS === 'android' ? 40 : 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: Platform.OS === 'android' ? 19 : 0,
            }
          }, 
            React.createElement(Text, {
              style: { 
                color: colors.primary, 
                fontSize: Platform.OS === 'android' ? 32 : 28,
                fontWeight: '600'
              }
            }, '←')
          ),
          React.createElement(TouchableOpacity, {
            key: 'settings',
            onPress: handleSettings,
            style: { 
              padding: 8, 
            }
          }, 
            React.createElement(require('../components/icons').SettingsIcon, { 
              color: colors.primary, 
              width: 28, 
              height: 28 
            })
          )
        ])
    });
  }, [navigation, theme, toggleTheme, handleSettings, handleGoBack, noteTitle, colors]);

  if (loading) {
    return (
      <View style={[GlobalStyles(theme).mainContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[GlobalStyles(theme).text, { marginTop: 16, textAlign: 'center' }]}>
          Loading note...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={GlobalStyles(theme).mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[GlobalStyles(theme).container, { width: '90%', alignSelf: 'center', flex: 1 }]}>
          {/* Title Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              style={[
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '600',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter note title"
              placeholderTextColor={colors.text + '60'}
              selectionColor={colors.primary}
              multiline={false}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          {/* Content Input - Takes up maximum available space */}
          <View style={{ flex: 1, marginBottom: 15 }}>
            <TextInput
              style={[
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  flex: 1,
                  textAlignVertical: 'top',
                }
              ]}
              value={details}
              onChangeText={setDetails}
              placeholder="Start writing your note..."
              placeholderTextColor={colors.text + '60'}
              selectionColor={colors.primary}
              multiline={true}
              scrollEnabled={true}
            />
          </View>

          {/* Error Display */}
          {error ? (
            <View style={{
              backgroundColor: colors.error + '20',
              padding: 15,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.error,
              marginBottom: 15,
            }}>
              <Text style={[GlobalStyles(theme).text, { color: colors.error, fontSize: 14 }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Create/Update Button - Always at bottom */}
          <View style={{ marginBottom: 20 }}>
            <CustomButton
              text={isNewNote ? 'Create Note' : 'Update Note'}
              onPress={handleSaveAndNavigate}
              disabled={saving || (!hasChanges && !isNewNote)}
              opacity={saving ? 0.6 : 1}
              height={50}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default NoteScreen;