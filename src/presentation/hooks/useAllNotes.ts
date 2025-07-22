import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../domain/types/store/RootState';
import { setAllNotes } from '../../application/store/action/notes/setAllNotes';
import { setNotesError } from '../../application/store/action/notes/setNotesError';
import { setNotesRefreshing } from '../../application/store/action/notes/setNotesRefreshing';
import { setAllBookmarks } from '../../application/store/action/bookmarks/setAllBookmarks';
import { notesSQLiteService } from '../../application/services/notes/notesSQLiteService';
import { deleteNote } from '../../application/services/notes/deleteNote';
import { bookmarksService } from '../../application/services/bookmarks/bookmarksService';
import { bookmarksSQLiteService } from '../../application/services/bookmarks/bookmarksSQLiteService';
import { syncQueueService } from '../../application/services/notes/syncQueueService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../infrastructure/storage/DatabaseSchema';

export const useAllNotes = () => {
  const dispatch = useDispatch();
  
  // Get notes from Redux (BULLETPROOF FILTERING)
  const notesData = useSelector((state: RootState) => state.notes?.data);
  const loading = useSelector((state: RootState) => state.notes?.loading);
  const refreshing = useSelector((state: RootState) => state.notes?.refreshing);
  const error = useSelector((state: RootState) => state.notes?.error);
  const authState = useSelector((state: RootState) => state.auth);

  // Local state for UI interactions (removed bookmarkingNotes - using optimistic updates)
  const [deletingNotes, setDeletingNotes] = React.useState<Set<string>>(new Set());
  const [bookmarkStates, setBookmarkStates] = React.useState<Map<string, boolean>>(new Map());

  // BULLETPROOF NOTES FILTERING: Only return valid notes for FlashList
  const notes = React.useMemo(() => {
    if (!Array.isArray(notesData)) {
      return [];
    }
    
    const validNotes = notesData.filter((note: any) => {
      const isValid = notesSQLiteService.validateNoteForUI(note);
      return isValid;
    });
    
    return validNotes;
  }, [notesData]);

  // Load bookmark states for all notes
  React.useEffect(() => {
    loadBookmarkStates();
  }, [notes, authState?.id]);

  /**
   * Load bookmark states for all notes
   */
  const loadBookmarkStates = React.useCallback(async () => {
    if (!authState?.id || notes.length === 0) return;
    
    try {
      const newStates = new Map<string, boolean>();
      
      for (const note of notes) {
        const isBookmarked = await bookmarksSQLiteService.isNoteBookmarked(note.id, authState.id);
        newStates.set(note.id, isBookmarked);
      }
      
      setBookmarkStates(newStates);
    } catch (error) {
      console.error('❌ Error loading bookmark states:', error);
    }
  }, [notes, authState?.id]);

  /**
   * Check if a specific note is bookmarked (with fallback to database check)
   */
  const isNoteBookmarked = React.useCallback(async (noteId: string): Promise<boolean> => {
    // First check local state for immediate UI response
    const localState = bookmarkStates.get(noteId);
    if (localState !== undefined) {
      return localState;
    }
    
    // Fallback to database check if not in local state
    if (authState?.id) {
      try {
        const dbState = await bookmarksSQLiteService.isNoteBookmarked(noteId, authState.id);
        // Update local state with database result
        setBookmarkStates(prev => {
          const newStates = new Map(prev);
          newStates.set(noteId, dbState);
          return newStates;
        });
        return dbState;
      } catch (error) {
        console.error('❌ Error checking bookmark state from database:', error);
      }
    }
    
    return false;
  }, [bookmarkStates, authState?.id]);

  /**
   * Handle bookmark toggle with optimistic UI updates (no loading states)
   */
  const handleBookmarkToggle = React.useCallback(async (noteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!authState?.id) {
      return { success: false, error: 'Not logged in' };
    }

    // Get current bookmark state from local state for instant response
    const currentLocalState = bookmarkStates.get(noteId) || false;
    const newOptimisticState = !currentLocalState;

    // STEP 1: INSTANT UI UPDATE (Optimistic)
    setBookmarkStates(prev => {
      const newStates = new Map(prev);
      newStates.set(noteId, newOptimisticState);
      return newStates;
    });

    const operation = currentLocalState ? 'REMOVE' : 'ADD';

    // STEP 2: BACKGROUND OPERATIONS (No UI loading)
    try {
      if (currentLocalState) {
        // Remove bookmark
        await bookmarksService.removeBookmark(noteId, authState.id, authState.accessToken);

        const queueId = await syncQueueService.addToQueue(
          OPERATION_TYPES.UNBOOKMARK,
          ENTITY_TYPES.BOOKMARK,
          noteId,
          { userId: authState.id, removedAt: new Date().toISOString() }
        );
      } else {
        // Add bookmark
        await bookmarksService.addBookmark(noteId, authState.id, authState.accessToken);

        const queueId = await syncQueueService.addToQueue(
          OPERATION_TYPES.BOOKMARK,
          ENTITY_TYPES.BOOKMARK,
          noteId,
          { userId: authState.id, bookmarkedAt: new Date().toISOString() }
        );
      }

      // STEP 3: UPDATE BOTH REDUX STATES IN BACKGROUND
      const freshNotes = await notesSQLiteService.fetchAllNotes(authState.id);
      dispatch(setAllNotes(freshNotes));

      const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(authState.id);
      dispatch(setAllBookmarks(freshBookmarks));

      return { success: true };

    } catch (error: any) {
      console.error(`❌ OPTIMISTIC ${operation} FAILED - Reverting UI:`, error);
      
      // STEP 4: REVERT UI ON FAILURE
      setBookmarkStates(prev => {
        const newStates = new Map(prev);
        newStates.set(noteId, currentLocalState); // Revert to original state
        return newStates;
      });
      
      // Also restore Redux state
      try {
        const freshNotes = await notesSQLiteService.fetchAllNotes(authState.id);
        dispatch(setAllNotes(freshNotes));
        
        const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(authState.id);
        dispatch(setAllBookmarks(freshBookmarks));
      } catch (restoreError) {
        console.error('❌ Failed to restore Redux state:', restoreError);
      }
      
      return { success: false, error: error.message || `Failed to ${operation.toLowerCase()} bookmark` };
    }
  }, [authState?.id, authState?.accessToken, bookmarkStates, dispatch]);

  /**
   * Handle note deletion with Redux state management and optimistic updates
   */
  const handleDeleteNote = React.useCallback(async (noteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!authState?.id) {
      return { success: false, error: 'Not logged in' };
    }
    
    // Set loading state for this specific note
    setDeletingNotes(prev => new Set(prev).add(noteId));
    
    try {
      const result = await deleteNote(noteId, authState.id, dispatch, authState.accessToken);
      
      if (result.success) {
        // Refresh bookmark states after note deletion
        await loadBookmarkStates();
        
        // Also refresh bookmarks Redux state since the note might have been bookmarked
        const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(authState.id);
        dispatch(setAllBookmarks(freshBookmarks));
        
        // Additional refresh after a short delay to ensure consistency
        setTimeout(async () => {
          try {
            const freshNotes = await notesSQLiteService.fetchAllNotes(authState.id);
            dispatch(setAllNotes(freshNotes));
          } catch (refreshError) {
            console.error('⚠️ Post-delete refresh failed:', refreshError);
          }
        }, 500);
        
        return { success: true };
      } else {
        console.error('❌ Delete operation failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during delete:', error);
      
      // Attempt to restore Redux state if delete failed
      try {
        const freshNotes = await notesSQLiteService.fetchAllNotes(authState.id);
        dispatch(setAllNotes(freshNotes));
        
        const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(authState.id);
        dispatch(setAllBookmarks(freshBookmarks));
      } catch (restoreError) {
        console.error('❌ Failed to restore Redux state:', restoreError);
      }
      
      return { success: false, error: error.message || 'Failed to delete note' };
    } finally {
      // Always clear loading state
      setDeletingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  }, [authState?.id, authState?.accessToken, dispatch, loadBookmarkStates]);

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = React.useCallback(async () => {
    if (!authState?.id) return;
    
    try {
      dispatch(setNotesRefreshing(true));
      
      const freshNotes = await notesSQLiteService.fetchAllNotes(authState.id);
      dispatch(setAllNotes(freshNotes));
      
      // Also refresh bookmarks Redux state
      const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(authState.id);
      dispatch(setAllBookmarks(freshBookmarks));
      
      // Refresh bookmark states
      await loadBookmarkStates();
      
    } catch (error: any) {
      console.error('❌ Error refreshing notes:', error);
      dispatch(setNotesError(error.message || 'Failed to refresh notes'));
    } finally {
      dispatch(setNotesRefreshing(false));
    }
  }, [authState?.id, dispatch, loadBookmarkStates]);

  return {
    notes,
    loading,
    refreshing,
    error,
    deletingNotes,
    handleBookmarkToggle,
    handleDeleteNote,
    handleRefresh,
  };
}; 