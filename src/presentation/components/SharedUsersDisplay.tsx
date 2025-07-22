import React, { useContext } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { GlobalStyles } from '../styles/GlobalStyles';

interface SharedUsersDisplayProps {
  sharedUsers?: string[];
  visible?: boolean;
}

const SharedUsersDisplay: React.FC<SharedUsersDisplayProps> = ({ 
  sharedUsers = [], 
  visible = false 
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);

  if (!visible) {
    return null;
  }

  const hasUsers = sharedUsers && sharedUsers.length > 0;

  return (
    <View style={{
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Text style={[
        GlobalStyles(theme).text,
        {
          fontSize: 12,
          color: colors.secondaryText,
          marginBottom: 6,
          fontWeight: '600',
        }
      ]}>
        {hasUsers ? 'Shared with:' : 'Sharing status:'}
              </Text>
        
        {hasUsers ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ flexDirection: 'row' }}
          >
            {sharedUsers.map((user, index) => (
              <View 
                key={`user-${index}-${user}`}
                style={{
                  backgroundColor: colors.primary + '20',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                }}
              >
                <Text style={[
                  GlobalStyles(theme).text,
                  {
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: '500',
                  }
                ]}>
                  {user}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 12,
              color: colors.secondaryText,
              fontStyle: 'italic',
            }
          ]}>
            This note is shared with no one
          </Text>
        </View>
      )}
    </View>
  );
};

export default SharedUsersDisplay; 