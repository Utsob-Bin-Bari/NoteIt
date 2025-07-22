import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import { getColors } from '../constants/Colors';
import { ThemeType } from '../../domain/types/theme/theme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { WiFiOfflineIcon, WiFiOnlineIcon, CheckIcon, SyncIcon } from './icons';

interface SyncStatusIconProps {
  theme: ThemeType;
  onRetryPress?: () => void;
}

const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({ theme, onRetryPress }) => {
  const colors = getColors(theme);
  const { syncState, queueStatus, manualRetry, isConnected } = useSyncStatus();
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const [currentAnimation, setCurrentAnimation] = React.useState<Animated.CompositeAnimation | null>(null);

  // Rotation animation for syncing state
  useEffect(() => {
    if (syncState === 'syncing') {
      // Start rotation animation
      animatedRotation.setValue(0);
      const rotation = Animated.loop(
        Animated.timing(animatedRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
      rotation.start();
      setCurrentAnimation(rotation);
    } else {
      // Stop rotation animation
      if (currentAnimation) {
        currentAnimation.stop();
        setCurrentAnimation(null);
      }
      animatedRotation.setValue(0);
    }
  }, [syncState]);

  const rotateInterpolate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    if (syncState === 'failed' && onRetryPress) {
      onRetryPress();
    } else if (syncState === 'failed') {
      manualRetry();
    }
  };

  const renderIcon = () => {
    switch (syncState) {
      case 'offline':
        return <WiFiOfflineIcon color={colors.iconGrey} width={20} height={20} />;
      
      case 'syncing':
        return (
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <SyncIcon color={colors.warning} width={20} height={20} />
          </Animated.View>
        );
      
      case 'synced':
        return isConnected ? 
          <WiFiOnlineIcon color={colors.networkConnected} width={20} height={20} /> :
          <WiFiOfflineIcon color={colors.iconGrey} width={20} height={20} />;
      
      case 'failed':
        return (
          <TouchableOpacity onPress={handlePress} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
            <SyncIcon color={colors.error} width={20} height={20} />
          </TouchableOpacity>
        );
      
      default:
        return isConnected ? 
          <WiFiOnlineIcon color={colors.networkConnected} width={20} height={20} /> :
          <WiFiOfflineIcon color={colors.iconGrey} width={20} height={20} />;
    }
  };

  // Calculate total operations for badge
  const totalOperations = queueStatus.pending + queueStatus.failed;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {renderIcon()}
      {totalOperations > 0 && (
        <Text style={{ 
          marginLeft: 4, 
          fontSize: 10, 
          color: syncState === 'failed' ? colors.error : colors.warning,
          fontWeight: '600',
          minWidth: 12,
          textAlign: 'center'
        }}>
          {totalOperations}
        </Text>
      )}
    </View>
  );
};

export default SyncStatusIcon; 