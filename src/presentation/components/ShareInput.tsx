import React, { useState, useContext } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { CheckIcon } from './icons';

interface ShareInputProps {
  visible: boolean;
  onShare: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const ShareInput: React.FC<ShareInputProps> = ({ visible, onShare }) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  
  const [email, setEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setSharing(true);
    setError(null);
    
    try {
      const result = await onShare(email.trim());
      
      if (result.success) {
        setShowSuccess(true);
        setEmail('');
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to share note');
      }
    } catch (error) {
      setError('Failed to share note. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{
          marginTop: 10,
          backgroundColor: colors.inputBackground,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
          }}>
            Share this note:
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TextInput
              style={{
                flex: 1,
                height: 40,
                paddingHorizontal: 12,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: error ? colors.error : colors.border,
                marginRight: 10,
              }}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null); // Clear error when typing
              }}
              placeholder="Enter email address"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing || showSuccess}
              style={{
                backgroundColor: showSuccess ? colors.success : colors.primary,
                borderRadius: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                minWidth: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="white" />
              ) : showSuccess ? (
                <CheckIcon color="white" width={16} height={16} />
              ) : (
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Share
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {error && (
            <Text style={{
              fontSize: 12,
              color: colors.error,
              marginTop: 6,
            }}>
              {error}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ShareInput; 