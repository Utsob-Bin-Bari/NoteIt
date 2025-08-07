import React, { useContext, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../domain/types/store/RootState';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useAllBookmarks } from '../hooks/useAllBookmarks';
import { BinIcon, BookmarkIcon, InfoIcon, ShareIcon } from './icons';
import SharedUsersDisplay from './SharedUsersDisplay';
import ShareInput from './ShareInput';
import { notesSQLiteService } from '../../application/services/notes/notesSQLiteService';

interface AllBookmarksComponentProps {
  navigation: any;
  searchQuery?: string;
  isFilterActive?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface BookmarkItemProps {
  item: any;
  onPress: () => void;
  onDelete: () => void;
  onInfoPress: () => void;
  onSharePress: () => void;
  onShare: (email: string) => Promise<{ success: boolean; error?: string }>;
  showSharedUsers?: boolean;
  showShareInput?: boolean;
  colors: any;
  theme: ThemeType;
}

const BookmarkItem: React.FC<BookmarkItemProps> = React.memo(({ 
  item, 
  onPress, 
  onDelete, 
  onInfoPress,
  onSharePress,
  onShare,
  showSharedUsers = false,
  showShareInput = false,
  colors, 
  theme 
}) => {
  const sharedUsers = item.shared_with || item.shared_users || [];
  const hasSharedUsers = Array.isArray(sharedUsers) && sharedUsers.length > 0;
  
  // Always show info icon for user convenience
  const showInfoIcon = true;

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ flex: 1, marginRight: 15 }} 
            onPress={onPress}
          >
            <Text style={[
              GlobalStyles(theme).text, 
              { 
                fontSize: 16, 
                fontWeight: '600', 
                color: colors.text,
              }
            ]}>
              {item.title || 'Untitled Note'}
            </Text>
            <Text style={[
              GlobalStyles(theme).text, 
              { 
                fontSize: 14, 
                color: colors.text,
                opacity: 0.6,
                marginTop: 4,
              }
            ]}>
              {new Date(item.updated_at || Date.now()).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* SHARE BUTTON */}
            <TouchableOpacity
              onPress={onSharePress}
              style={{
                backgroundColor: showShareInput ? colors.primary + '20' : colors.secondary,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <ShareIcon 
                color={showShareInput ? colors.primary : colors.iconGrey} 
                width={16} 
                height={16} 
              />
            </TouchableOpacity>
            
            {/* INFO BUTTON - Shows shared users */}
            {showInfoIcon && (
              <TouchableOpacity
                onPress={onInfoPress}
                style={{
                  backgroundColor: showSharedUsers ? colors.success + '20' : colors.secondary,
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <InfoIcon 
                  color={showSharedUsers ? colors.success : colors.iconGrey} 
                  width={16} 
                  height={16} 
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onDelete}
              style={{
                backgroundColor: colors.warning + '20',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <BookmarkIcon color={colors.warning} width={16} height={16} filled={true} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <BinIcon color={colors.error} width={16} height={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* SHARED USERS DISPLAY */}
      <SharedUsersDisplay 
        sharedUsers={sharedUsers}
        visible={showSharedUsers}
      />
      
      {/* SHARE INPUT */}
      <ShareInput 
        visible={showShareInput}
        onShare={onShare}
      />
    </View>
  );
  }, (prevProps, nextProps) => {
  // Custom comparison function that properly handles theme changes
  return (
    prevProps.item.local_id === nextProps.item.local_id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.updated_at === nextProps.item.updated_at &&
    prevProps.showSharedUsers === nextProps.showSharedUsers &&
    prevProps.showShareInput === nextProps.showShareInput &&
    prevProps.theme === nextProps.theme &&
    JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors)
  );
});

const AllBookmarksComponent: React.FC<AllBookmarksComponentProps> = ({ 
  navigation, 
  searchQuery = '',
  isFilterActive = false,
  refreshing: externalRefreshing = false, 
  onRefresh: externalOnRefresh 
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const dispatch = useDispatch();
  
  // Get current user ID from Redux auth state
  const authState = useSelector((state: RootState) => state.auth);
  const currentUserId = authState?.id;
  
  // Memoize colors to prevent unnecessary recreations
  const colors = useMemo(() => getColors(theme), [theme]);
  
  const {
    bookmarks: bookmarksData,
    loading,
    refreshing: internalRefreshing,
    error,
    handleRefresh: internalHandleRefresh,
    handleToggleBookmark,
  } = useAllBookmarks();

  const isRefreshing = externalRefreshing || internalRefreshing;
  const handleRefresh = externalOnRefresh || internalHandleRefresh;

  // State for tracking which bookmark's shared users are visible
  const [visibleSharedUsers, setVisibleSharedUsers] = useState<Set<string>>(new Set());
  
  // State for tracking which bookmark's share input is visible
  const [visibleShareInput, setVisibleShareInput] = useState<Set<string>>(new Set());

  // BULLETPROOF BOOKMARKS FILTERING: Only return valid bookmarks for FlashList
  const bookmarks = useMemo(() => {
    if (!Array.isArray(bookmarksData)) {
      return [];
    }
    
    let validBookmarks = bookmarksData.filter((bookmark: any) => {
      const isValid = notesSQLiteService.validateNoteForUI(bookmark);
      return isValid;
    });

    // Apply filter for "shared with me" (bookmarks where owner_id !== currentUserId)
    if (isFilterActive) {
      validBookmarks = validBookmarks.filter(bookmark => 
        bookmark.owner_id && bookmark.owner_id !== currentUserId
      );
    }

    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      validBookmarks = validBookmarks.filter(bookmark => 
        bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    
    return validBookmarks;
  }, [bookmarksData, searchQuery, isFilterActive, currentUserId]);

  // BULLETPROOF KEY EXTRACTOR: Use local_id as primary key
  const safeKeyExtractor = useMemo(() => (item: any) => {
    const key = item.local_id || `bookmark_${Date.now()}_${Math.random()}`;
    return String(key); // Ensure always returns string
  }, []);

  /**
   * Handle bookmark press to navigate to editor
   */
  const handleBookmarkPress = React.useCallback((bookmark: any) => {
    const noteId = bookmark.local_id; // Always use local_id for UI operations
    const noteTitle = bookmark.title || 'Untitled Note';
    
    if (noteId) {
      // Navigate to Note screen with noteId parameter
      navigation.navigate('Note', { noteId, title: noteTitle });
    } else {
      console.error('❌ Cannot navigate - bookmark has no valid local_id');
    }
  }, [navigation]);

  /**
   * Handle bookmark removal with optimistic UI feedback
   */
  const handleBookmarkToggle = async (bookmark: any) => {
    const noteTitle = bookmark.title || 'Untitled Note';
    const noteId = bookmark.local_id; // Always use local_id for UI operations
    
    // NO CONFIRMATION ALERT - Direct removal with optimistic UI
    try {
      if (noteId) {
        // Use the new optimistic UI toggle that returns result
        const result = await handleToggleBookmark(noteId);
        
        if (result.success) {
          // Bookmark removal completed successfully
          // Note: UI was already updated optimistically in the hook
        } else {
          console.error('❌ Bookmark removal failed (UI will auto-revert):', result.error);
          // Note: UI already reverted automatically in the hook
          
          // Show user feedback for persistent failures
          Alert.alert(
            'Remove Bookmark Failed',
            result.error || 'Failed to remove bookmark. The change has been reverted.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.error('❌ Cannot remove bookmark - no valid ID');
        Alert.alert(
          'Error',
          'Cannot remove bookmark - invalid note ID.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error during bookmark removal:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. The bookmark change has been reverted.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle info icon press to toggle shared users visibility
   */
  const handleInfoPress = useCallback((bookmark: any) => {
    // Always use local_id for UI operations
    const bookmarkId = bookmark.local_id;
    setVisibleSharedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle share icon press to toggle share input visibility
   */
  const handleSharePress = useCallback((bookmark: any) => {
    // Check if current user is the owner of the note
    if (bookmark.owner_id !== currentUserId) {
      Alert.alert(
        'Cannot Share Note',
        'You have to be the owner to able to share the note.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Use same ID resolution as other functions
    const bookmarkId = bookmark.local_id;
    setVisibleShareInput(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  }, [currentUserId]);

  /**
   * Handle bookmark sharing
   */
  const handleShare = useCallback(async (bookmark: any, email: string): Promise<{ success: boolean; error?: string }> => {
    const bookmarkId = bookmark.local_id; // Always use local_id for UI operations
    
    try {
      // Import shareNote service
      const { shareNote } = await import('../../application/services/notes/shareNote');
      
      const result = await shareNote(bookmarkId, email, currentUserId || '', dispatch, authState?.accessToken);
      
      if (result.success) {
        // Hide share input after successful share
        setVisibleShareInput(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookmarkId);
          return newSet;
        });
      }
      
      return result;
    } catch (error) {
      console.error('Share error:', error);
      return {
        success: false,
        error: 'Failed to share bookmark. Please try again.'
      };
    }
  }, [currentUserId, dispatch, authState?.accessToken]);

  // Memoize renderItem to prevent unnecessary re-creations
  const renderItem = useCallback(({ item }: { item: any }) => {
    // Use same ID resolution as safeKeyExtractor
    const itemId = item.local_id;
    const showSharedUsers = visibleSharedUsers.has(itemId);
    const showShareInput = visibleShareInput.has(itemId);
    
    return (
      <BookmarkItem
        item={item}
        onPress={() => handleBookmarkPress(item)}
        onDelete={() => handleBookmarkToggle(item)}
        onInfoPress={() => handleInfoPress(item)}
        onSharePress={() => handleSharePress(item)}
        onShare={(email: string) => handleShare(item, email)}
        showSharedUsers={showSharedUsers}
        showShareInput={showShareInput}
        colors={colors}
        theme={theme}
      />
    );
  }, [colors, theme, handleBookmarkPress, handleBookmarkToggle, handleInfoPress, handleSharePress, handleShare, visibleSharedUsers, visibleShareInput]);

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 60,
    }}>
      <Text style={[
        GlobalStyles(theme).text, 
        { 
          fontSize: 18, 
          textAlign: 'center',
          color: colors.text,
          opacity: 0.7
        }
      ]}>
        {isFilterActive 
          ? 'No shared bookmarks'
          : searchQuery.trim() 
            ? 'No bookmarks found' 
            : 'No bookmarked notes yet'
        }
      </Text>
      <Text style={[
        GlobalStyles(theme).text, 
        { 
          fontSize: 14, 
          textAlign: 'center', 
          marginTop: 8,
          color: colors.text,
          opacity: 0.5
        }
      ]}>
        {isFilterActive
          ? 'No shared notes have been bookmarked yet'
          : searchQuery.trim() 
            ? `No bookmarks found matching "${searchQuery}"` 
            : 'Bookmark notes you want to save for later'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[GlobalStyles(theme).text, { marginTop: 10, color: colors.text }]}>
          Loading bookmarks...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Filter Status Message */}
      {isFilterActive && (
        <View style={{
          backgroundColor: colors.primary + '10',
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            textAlign: 'center',
          }}>
            These notes are shared with you
          </Text>
        </View>
      )}
      
      <FlashList
        data={bookmarks}
        renderItem={renderItem}
        estimatedItemSize={120}
        keyExtractor={safeKeyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        // Performance optimizations for large datasets
        removeClippedSubviews={true}
        getItemType={() => 'bookmark'} // Single item type for better performance
        // Force re-render when theme or visible state changes
        extraData={{ theme, visibleSharedUsers: visibleSharedUsers.size, visibleShareInput: visibleShareInput.size }}
      />
      
      {error && (
        <View style={{
          backgroundColor: colors.error + '20',
          padding: 15,
          margin: 20,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: colors.error,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
          <Text style={[GlobalStyles(theme).text, { color: colors.error, fontSize: 14 }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AllBookmarksComponent; 