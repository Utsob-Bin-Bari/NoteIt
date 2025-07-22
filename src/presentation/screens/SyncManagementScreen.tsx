import React, { useContext, useLayoutEffect, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { GlobalStyles } from '../styles/GlobalStyles';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { useSyncManagement } from '../hooks/useSyncManagement';
import { QueueOperation } from '../../application/services/notes/syncQueueService';
import { getColors } from '../constants/Colors';
import { getSimpleHeaderOptions } from '../styles/CustomHeaderStyle';
import { BinIcon, SyncIcon, CheckIcon } from '../components/icons';

const SyncManagementScreen = ({ navigation }: any) => {
  const { theme, toggleTheme } = useContext(AppContext) as { theme: ThemeType, toggleTheme: () => void };
  const colors = getColors(theme);
  
  const {
    loading,
    error,
    allOperations, // All operations for FlashList
    pendingOperations,
    failedOperations,
    queueStatus,
    realQueueStatus, // Real database status
    operationStates,
    clearFailedDeletesState,
    handleBack,
    handleDeleteOperation,
    handleSyncOperation,
    handleSyncAll,
    handleClearCompleted,
    handleClearFailedDeletes,
    loadSyncData,
  } = useSyncManagement();

  const syncAllRotateValue = useRef(new Animated.Value(0)).current;
  const clearFailedDeletesRotateValue = useRef(new Animated.Value(0)).current;

  // Sync All rotation animation
  useEffect(() => {
    if (loading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(syncAllRotateValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      syncAllRotateValue.setValue(0);
    }
  }, [loading]);

  // Clear Failed Deletes rotation animation
  useEffect(() => {
    if (clearFailedDeletesState === 'loading') {
      const rotateAnimation = Animated.loop(
        Animated.timing(clearFailedDeletesRotateValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      clearFailedDeletesRotateValue.setValue(0);
    }
  }, [clearFailedDeletesState]);

  const syncAllRotate = syncAllRotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const clearFailedDeletesRotate = clearFailedDeletesRotateValue.interpolate({
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

  /**
   * Format operation payload for display
   */
  const formatPayload = (payload: string | null): string => {
    if (!payload) return 'No data';
    
    try {
      const parsed = JSON.parse(payload);
      if (parsed.title) {
        return `"${parsed.title.substring(0, 30)}${parsed.title.length > 30 ? '...' : ''}"`;
      }
      return 'Note data';
    } catch {
      return 'Invalid data';
    }
  };

  /**
   * Get status color based on operation status
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      case 'completed': return colors.success;
      default: return colors.text;
    }
  };

  /**
   * Get operation type emoji
   */
  const getOperationEmoji = (operationType: string): string => {
    switch (operationType) {
      case 'create': return '✨';
      case 'update': return '📝';
      case 'delete': return '🗑️';
      default: return '📋';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  /**
   * Render individual operation item for FlashList
   */
  const renderOperationItem = ({ item }: { item: QueueOperation }) => {
    const currentState = operationStates[item.id] || 'idle';
    const statusColor = getStatusColor(item.status);
    const operationEmoji = getOperationEmoji(item.operation_type);
    
    return (
      <View style={{
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
      }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>{operationEmoji}</Text>
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
                flex: 1,
              }
            ]}>
              {item.operation_type.toUpperCase()} {item.entity_type}
            </Text>
            <View style={{
              backgroundColor: statusColor + '20',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={[
                GlobalStyles(theme).text,
                {
                  fontSize: 12,
                  color: statusColor,
                  fontWeight: '600',
                }
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Details */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 14,
              color: colors.text + '80',
              marginBottom: 4,
            }
          ]}>
            ID: {item.entity_id.length > 20 ? 
              `${item.entity_id.substring(0, 20)}...` : 
              item.entity_id
            }
          </Text>
          
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 14,
              color: colors.text + '80',
              marginBottom: 4,
            }
          ]}>
            Content: {formatPayload(item.payload)}
          </Text>
          
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 12,
              color: colors.text + '60',
            }
          ]}>
            Created: {formatDate(item.created_at)} • Retries: {item.retry_count}/{item.max_retries}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.error + '15',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={() => handleDeleteOperation(item.id)}
            disabled={currentState === 'loading'}
          >
            <BinIcon color={colors.error} width={14} height={14} />
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 12,
                color: colors.error,
                marginLeft: 4,
                fontWeight: '600',
              }
            ]}>
              Delete
            </Text>
          </TouchableOpacity>
          
          {item.status === 'failed' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '15',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
              onPress={() => handleSyncOperation(item.id)}
              disabled={currentState === 'loading'}
            >
              <SyncIcon color={colors.primary} width={14} height={14} />
              <Text style={[
                GlobalStyles(theme).text,
                {
                  fontSize: 12,
                  color: colors.primary,
                  marginLeft: 4,
                  fontWeight: '600',
                }
              ]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
          
          {currentState !== 'idle' && renderRightIcon(currentState, syncAllRotateValue)}
        </View>
      </View>
    );
  };

  useLayoutEffect(() => {
    const headerOptions = getSimpleHeaderOptions(theme, toggleTheme);
    navigation.setOptions({
      ...headerOptions,
      title: 'Sync Management',
    });
  }, [navigation, theme, toggleTheme]);

  const failedDeletesCount = failedOperations.filter(op => op.operation_type === 'delete').length;

  return (
    <View style={GlobalStyles(theme).mainContainer}>
      <View style={[GlobalStyles(theme).container, { width: '90%', alignSelf: 'center'}]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadSyncData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        
        {/* Enhanced Queue Status */}
        <View style={{
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 15,
            }
          ]}>
            📊 Queue Status
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[GlobalStyles(theme).text, { fontSize: 16, color: colors.warning }]}>
              Pending: {realQueueStatus.pending}
            </Text>
            <Text style={[GlobalStyles(theme).text, { fontSize: 16, color: colors.error }]}>
              Failed: {realQueueStatus.failed}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[GlobalStyles(theme).text, { fontSize: 16, color: colors.success }]}>
              Completed: {realQueueStatus.completed}
            </Text>
            <Text style={[GlobalStyles(theme).text, { fontSize: 16, color: colors.primary }]}>
              Total: {realQueueStatus.total}
            </Text>
          </View>
        </View>

        {/* Operations List Header */}
        {allOperations.length > 0 && (
          <View style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
              }
            ]}>
              📋 All Operations ({allOperations.length})
            </Text>
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 14,
                color: colors.text + '80',
                textAlign: 'center',
                marginTop: 4,
              }
            ]}>
              Direct from database • Pull to refresh
            </Text>
          </View>
        )}

        {/* Sync All Operations */}
        <TouchableOpacity 
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleSyncAll}
          disabled={loading || failedOperations.length === 0}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <SyncIcon color={colors.primary} width={24} height={24} />
              <Text style={[
                GlobalStyles(theme).text,
                {
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.primary,
                  marginLeft: 12,
                }
              ]}>
                Retry All Failed Operations
              </Text>
            </View>
            {renderRightIcon(loading ? 'loading' : 'idle', syncAllRotate)}
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
            Retry all failed sync operations. This will attempt to sync them again.
          </Text>
        </TouchableOpacity>

        {/* Clear Failed Delete Operations */}
        {failedDeletesCount > 0 && (
          <TouchableOpacity 
            style={{
              backgroundColor: colors.inputBackground,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={handleClearFailedDeletes}
            disabled={clearFailedDeletesState === 'loading'}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <BinIcon color={colors.warning} width={24} height={24} />
                <Text style={[
                  GlobalStyles(theme).text,
                  {
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.warning,
                    marginLeft: 12,
                  }
                ]}>
                  Clear Failed Deletes ({failedDeletesCount})
                </Text>
              </View>
              {renderRightIcon(clearFailedDeletesState, clearFailedDeletesRotate)}
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
              Clear failed delete operations. These are likely notes that no longer exist on the server.
            </Text>
          </TouchableOpacity>
        )}

        {/* Clear Completed Operations */}
        <TouchableOpacity 
          style={{
            backgroundColor: colors.inputBackground,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={handleClearCompleted}
          disabled={loading}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <CheckIcon color={colors.success} width={24} height={24} />
            <Text style={[
              GlobalStyles(theme).text,
              {
                fontSize: 18,
                fontWeight: '600',
                color: colors.success,
                marginLeft: 12,
              }
            ]}>
              Clear Completed Operations
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
            Remove all completed operations from the sync queue to clean up the database.
          </Text>
        </TouchableOpacity>

        {error ? (
          <Text style={[GlobalStyles(theme).errorText, { marginTop: 10, textAlign: 'center', marginBottom: 20 }]}>
            {error}
          </Text>
        ) : null}

        <View style={{ height: 50 }} />
      </ScrollView>
      
      {/* FlashList for Operations - Positioned below ScrollView */}
      {allOperations.length > 0 && (
        <View style={{ 
          height: 400, // Fixed height for FlashList
          marginTop: 10,
        }}>
          <FlashList
            data={allOperations}
            renderItem={renderOperationItem}
            keyExtractor={(item) => item.id.toString()}
            estimatedItemSize={120}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}
      
      {/* Empty State */}
      {allOperations.length === 0 && !loading && (
        <View style={{
          backgroundColor: colors.inputBackground,
          borderRadius: 12,
          padding: 30,
          margin: 20,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }
          ]}>
            No Operations Found
          </Text>
          <Text style={[
            GlobalStyles(theme).text,
            {
              fontSize: 14,
              color: colors.text + '80',
              textAlign: 'center',
            }
          ]}>
            Create, update, or delete notes to see sync operations here
          </Text>
        </View>
      )}
      </View>
    </View>
  );
};

export default SyncManagementScreen; 