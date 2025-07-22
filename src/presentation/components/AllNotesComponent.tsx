import React, { useContext, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AppContext } from '../../application/context/AppContext';
import { ThemeType } from '../../domain/types/theme/theme';
import { getColors } from '../constants/Colors';
import { GlobalStyles } from '../styles/GlobalStyles';
import { useAllNotes } from '../hooks/useAllNotes';
import { BinIcon, BookmarkIcon, InfoIcon, ShareIcon } from './icons';
import SharedUsersDisplay from './SharedUsersDisplay';
import ShareInput from './ShareInput';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../domain/types/store/RootState';

interface AllNotesComponentProps {
  navigation: any;
  searchQuery?: string;
  isFilterActive?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface NoteItemProps {
  item: any;
  onPress: () => void;
  onDelete: () => void;
  onBookmark: () => void;
  onInfoPress: () => void;
  onSharePress: () => void;
  onShare: (email: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting?: boolean;
  isBookmarked?: boolean;
  showSharedUsers?: boolean;
  showShareInput?: boolean;
  colors: any;
  theme: ThemeType;
}

const NoteItem: React.FC<NoteItemProps> = React.memo(({ 
  item, 
  onPress, 
  onDelete, 
  onBookmark, 
  onInfoPress,
  onSharePress,
  onShare,
  isDeleting = false,
  isBookmarked = false,
  showSharedUsers = false,
  showShareInput = false,
  colors, 
  theme 
}) => {
  const isDeleteDisabled = isDeleting;
  // No bookmark disable logic - optimistic updates work instantly
  
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
            disabled={isDeleteDisabled}
          >
            <Text style={[
              GlobalStyles(theme).text, 
              { 
                fontSize: 16, 
                fontWeight: '600', 
                color: colors.text,
                opacity: isDeleteDisabled ? 0.5 : 1
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
              {new Date(item.updated_at).toLocaleDateString()}
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
            
            {/* OPTIMISTIC BOOKMARK BUTTON - No loading states, no border */}
            <TouchableOpacity
              onPress={onBookmark}
              style={{
                backgroundColor: isBookmarked ? colors.warning + '20' : colors.secondary,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <BookmarkIcon 
                color={isBookmarked ? colors.warning : colors.text} 
                width={16} 
                height={16} 
                filled={isBookmarked}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              disabled={isDeleteDisabled}
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 8,
                padding: 8,
                opacity: isDeleteDisabled ? 0.5 : 1
              }}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <BinIcon color={colors.error} width={16} height={16} />
              )}
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
  // Simplified comparison - no need to check loading states
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.updated_at === nextProps.item.updated_at &&
    prevProps.isDeleting === nextProps.isDeleting &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.showSharedUsers === nextProps.showSharedUsers &&
    prevProps.showShareInput === nextProps.showShareInput &&
    prevProps.theme === nextProps.theme &&
    JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors)
  );
});

const AllNotesComponent: React.FC<AllNotesComponentProps> = ({ 
  navigation, 
  searchQuery = '',
  isFilterActive = false,
  refreshing: externalRefreshing = false, 
  onRefresh: externalOnRefresh 
}) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const dispatch = useDispatch();
  
  // Memoize colors to prevent unnecessary recreations
  const colors = useMemo(() => getColors(theme), [theme]);
  
  const {
    notes,
    loading,
    refreshing: internalRefreshing,
    error,
    deletingNotes,
    handleRefresh: internalHandleRefresh,
    handleDeleteNote,
    handleBookmarkToggle,
  } = useAllNotes();

  // Get current user ID from Redux auth state
  const authState = useSelector((state: RootState) => state.auth);
  const currentUserId = authState?.id;

  const isRefreshing = externalRefreshing || internalRefreshing;
  const handleRefresh = externalOnRefresh || internalHandleRefresh;

  // State for tracking which note's shared users are visible
  const [visibleSharedUsers, setVisibleSharedUsers] = useState<Set<string>>(new Set());
  
  // State for tracking which note's share input is visible
  const [visibleShareInput, setVisibleShareInput] = useState<Set<string>>(new Set());

  // Filter notes based on search query and filter status
  const filteredNotes = useMemo(() => {
    let result = notes;
    
    // Apply filter for "shared with me" (notes where owner_id !== currentUserId)
    if (isFilterActive) {
      result = result.filter(note => 
        note.owner_id && note.owner_id !== currentUserId
      );
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      result = result.filter(note => 
        note.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    
    return result;
  }, [notes, searchQuery, isFilterActive, currentUserId]);

  // Enhanced bookmark state checker that examines the bookmarked_by array
  const isBookmarkedSync = React.useCallback((noteId: string): boolean => {
    if (!currentUserId) return false;
    
    // Check if this note is in the bookmarked notes by examining the bookmarked_by array
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.bookmarked_by || !Array.isArray(note.bookmarked_by)) {
      return false;
    }
    
    const isBookmarked = note.bookmarked_by.includes(currentUserId);
    return isBookmarked;
  }, [notes, currentUserId]);

  /**
   * Handle bookmark toggle with optimistic UI feedback
   */
  const handleBookmark = React.useCallback(async (note: any) => {
    const noteId = note.id;
    const noteTitle = note.title?.trim() || 'Untitled Note';
    const isCurrentlyBookmarked = isBookmarkedSync(noteId);
    
    try {
      const result = await handleBookmarkToggle(noteId);
      
      if (result.success) {
        // Bookmark operation completed successfully
        
      } else {
        console.error('❌ Bookmark operation failed (UI will auto-revert):', result.error);
        
        // Optional: Show user feedback for persistent failures
        const action = isCurrentlyBookmarked ? 'remove from' : 'add to';
        Alert.alert(
          'Bookmark Failed',
          result.error || `Failed to ${action} bookmarks. The change has been reverted.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error during bookmark operation:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. The bookmark change has been reverted.',
        [{ text: 'OK' }]
      );
    }
  }, [handleBookmarkToggle, isBookmarkedSync]);

  /**
   * Handle note press to navigate to editor
   */
  const handleNotePress = React.useCallback((note: any) => {
    const noteId = note.id || note.local_id;
    const noteTitle = note.title || 'Untitled Note';
    
    if (noteId) {
      // Navigate to Note screen with noteId parameter
      navigation.navigate('Note', { noteId, title: noteTitle });
    } else {
      console.error('❌ Cannot navigate - note has no valid ID');
    }
  }, [navigation]);

  /**
   * Handle note deletion with user confirmation
   */
  const handleNoteDelete = React.useCallback(async (note: any) => {
    const noteId = note.id || note.local_id;
    const noteTitle = note.title?.trim() || 'Untitled Note';
    
    if (!noteId) {
      console.error('❌ Cannot delete note - no valid ID');
      return;
    }

    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await handleDeleteNote(noteId);
              
              if (result.success) {
                // Post-delete operations
                setTimeout(() => {
                  // Refresh verification can be added here if needed
                }, 500);
              } else {
                Alert.alert(
                  'Delete Failed',
                  result.error || 'Failed to delete the note. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('❌ Unexpected error during note deletion:', error);
              Alert.alert(
                'Error',
                'An unexpected error occurred while deleting the note.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [handleDeleteNote]);

  /**
   * Handle info icon press to toggle shared users visibility
   */
  const handleInfoPress = useCallback((note: any) => {
    // Use same ID resolution as other functions
    const noteId = note.id || note.local_id;
    setVisibleSharedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle share icon press to toggle share input visibility
   */
  const handleSharePress = useCallback((note: any) => {
    // Use same ID resolution as other functions
    const noteId = note.id || note.local_id;
    setVisibleShareInput(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle note sharing
   */
  const handleShare = useCallback(async (note: any, email: string): Promise<{ success: boolean; error?: string }> => {
    const noteId = note.id || note.local_id;
    
    try {
      // Import shareNote service
      const { shareNote } = await import('../../application/services/notes/shareNote');
      
      const result = await shareNote(noteId, email, currentUserId || '', dispatch);
      
      if (result.success) {
        // Hide share input after successful share
        setVisibleShareInput(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
      }
      
      return result;
    } catch (error) {
      console.error('Share error:', error);
      return {
        success: false,
        error: 'Failed to share note. Please try again.'
      };
    }
  }, [currentUserId, dispatch]);

  // Memoize renderItem to prevent unnecessary re-creations
  const renderItem = useCallback(({ item }: { item: any }) => {
    const isBookmarkedState = isBookmarkedSync(item.id);
    // Use consistent ID resolution
    const itemId = item.id || item.local_id;
    const showSharedUsers = visibleSharedUsers.has(itemId);
    const showShareInput = visibleShareInput.has(itemId);
    
    return (
      <NoteItem
        item={item}
        onPress={() => handleNotePress(item)}
        onDelete={() => handleNoteDelete(item)}
        onBookmark={() => handleBookmark(item)}
        onInfoPress={() => handleInfoPress(item)}
        onSharePress={() => handleSharePress(item)}
        onShare={(email: string) => handleShare(item, email)}
        isDeleting={deletingNotes.has(item.id)}
        isBookmarked={isBookmarkedState}
        showSharedUsers={showSharedUsers}
        showShareInput={showShareInput}
        colors={colors}
        theme={theme}
      />
    );
  }, [colors, theme, deletingNotes, isBookmarkedSync, handleNotePress, handleNoteDelete, handleBookmark, handleInfoPress, handleSharePress, handleShare, visibleSharedUsers, visibleShareInput]);

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
          ? 'No shared notes'
          : searchQuery.trim() 
            ? 'No notes found' 
            : 'No notes yet'
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
          ? 'No notes have been shared with you yet'
          : searchQuery.trim() 
            ? `No notes found matching "${searchQuery}"` 
            : 'Tap + to create your first note'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[GlobalStyles(theme).text, { marginTop: 10, color: colors.text }]}>
          Loading notes...
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
        data={filteredNotes}
        renderItem={renderItem}
        estimatedItemSize={120} // Increased for better estimation with date
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
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
        getItemType={() => 'note'} // Single item type for better performance
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

export default AllNotesComponent;