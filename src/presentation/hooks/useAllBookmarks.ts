import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../domain/types/store/RootState';
import { setAllBookmarks } from '../../application/store/action/bookmarks/setAllBookmarks';
import { setBookmarksError } from '../../application/store/action/bookmarks/setBookmarksError';
import { setBookmarksLoading } from '../../application/store/action/bookmarks/setBookmarksLoading';
import { setBookmarksRefreshing } from '../../application/store/action/bookmarks/setBookmarksRefreshing';
import { setAllNotes } from '../../application/store/action/notes/setAllNotes';
import { bookmarksService } from '../../application/services/bookmarks/bookmarksService';
import { bookmarksSQLiteService } from '../../application/services/bookmarks/bookmarksSQLiteService';
import { notesSQLiteService } from '../../application/services/notes/notesSQLiteService';
import { NetworkService } from '../../infrastructure/utils/NetworkService';

/**
 * Bookmarks hook with optimistic UI updates (matching useAllNotes approach)
 */
export const useAllBookmarks = () => {
  const dispatch = useDispatch();
  
  const reduxUserData = useSelector((state: RootState) => state.auth);
  const {
    data: bookmarks,
    loading,
    refreshing,
    syncing,
    syncStatus,
    error,
  } = useSelector((state: RootState) => state.bookmarks);
  
  const isLoggedIn = !!(reduxUserData?.id);
  
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  
  const checkNetworkStatus = useCallback(async () => {
    const networkState = await NetworkService.getCurrentNetworkState();
    const connected = !!(networkState.isConnected && networkState.isInternetReachable);
    setIsOnline(connected);
  }, []);
  
  const updateSyncStatus = useCallback(async () => {
    return {
      hasLocalChanges: false,
      pendingOperations: 0,
      failedOperations: 0,
    };
  }, [reduxUserData?.id]);

  /**
   * Load bookmarks from local database
   */
  const loadBookmarksFromLocal = useCallback(async () => {
    if (!reduxUserData?.id) return;
    
    try {
      dispatch(setBookmarksLoading(true));
      dispatch(setBookmarksError(''));
      
      const localBookmarks = await bookmarksService.loadBookmarksFromLocal(reduxUserData.id);
      
      dispatch(setAllBookmarks(localBookmarks));
      
    } catch (error: any) {
      console.log('Error loading bookmarks:', error);
      dispatch(setBookmarksError(error.message || 'Failed to load bookmarks'));
    } finally {
      dispatch(setBookmarksLoading(false));
    }
  }, [reduxUserData?.id, dispatch]);

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = useCallback(async () => {
    if (!reduxUserData?.id) return;
    
    try {
      dispatch(setBookmarksRefreshing(true));
      
      const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(reduxUserData.id);
      dispatch(setAllBookmarks(freshBookmarks));
      
    } catch (error: any) {
      console.log('Error refreshing bookmarks:', error);
      dispatch(setBookmarksError(error.message || 'Failed to refresh bookmarks'));
    } finally {
      dispatch(setBookmarksRefreshing(false));
    }
  }, [reduxUserData?.id, dispatch]);
  
  /**
   * OPTIMISTIC UI BOOKMARK TOGGLE (Same as useAllNotes approach)
   */
  const handleToggleBookmark = useCallback(async (noteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!reduxUserData?.id) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      // Get current bookmark state from database for accuracy
      const isCurrentlyBookmarked = await bookmarksSQLiteService.isNoteBookmarked(noteId, reduxUserData.id);

      const operation = isCurrentlyBookmarked ? 'REMOVE' : 'ADD';

      // STEP 1: OPTIMISTIC UI UPDATE - Remove from bookmarks list immediately
      if (isCurrentlyBookmarked) {
        const currentBookmarks = bookmarks || [];
        const updatedBookmarks = currentBookmarks.filter(bookmark => bookmark.local_id !== noteId);
        dispatch(setAllBookmarks(updatedBookmarks));
      }

      // STEP 2: BACKGROUND OPERATIONS (Same as useAllNotes)
      if (isCurrentlyBookmarked) {
        // Remove bookmark - service handles queue and sync automatically
        await bookmarksService.removeBookmark(noteId, reduxUserData.id, reduxUserData.accessToken);
      } else {
        // Add bookmark - service handles queue and sync automatically
        await bookmarksService.addBookmark(noteId, reduxUserData.id, reduxUserData.accessToken);
      }

      // STEP 3: UPDATE BOTH REDUX STATES IN BACKGROUND
      
      // Update bookmarks Redux state
      const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(reduxUserData.id);
      dispatch(setAllBookmarks(freshBookmarks));

      // Update notes Redux state to sync bookmark states across components
      const freshNotes = await notesSQLiteService.fetchAllNotes(reduxUserData.id);
      dispatch(setAllNotes(freshNotes));

      return { success: true };

    } catch (error: any) {
      console.log('Optimistic bookmark toggle failed (Bookmarks Page):', error);
      
      // STEP 4: REVERT UI ON FAILURE
      try {
        const freshBookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(reduxUserData.id);
        dispatch(setAllBookmarks(freshBookmarks));
        
        const freshNotes = await notesSQLiteService.fetchAllNotes(reduxUserData.id);
        dispatch(setAllNotes(freshNotes));
      } catch (restoreError) {
        console.log('Failed to restore Redux states:', restoreError);
      }
      
      return { success: false, error: error.message || 'Failed to toggle bookmark' };
    }
  }, [reduxUserData?.id, reduxUserData?.accessToken, bookmarks, dispatch]);
  
  const isNoteBookmarked = useCallback(async (noteId: string): Promise<boolean> => {
    if (!isLoggedIn || !reduxUserData?.id) return false;
    
    try {
      return await bookmarksService.isNoteBookmarked(noteId, reduxUserData.id);
    } catch (error) {
      console.log('Error checking bookmark status:', error);
      return false;
    }
  }, [isLoggedIn, reduxUserData?.id]);
  
  const getNetworkSyncState = useCallback(() => {
    if (!isOnline) return 'offline';
    return 'online';
  }, [isOnline]);
  
  // Load bookmarks on mount
  useEffect(() => {
    if (reduxUserData?.id) {
      loadBookmarksFromLocal();
    }
  }, [reduxUserData?.id, loadBookmarksFromLocal]);

  // Check network status periodically
  useEffect(() => {
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkNetworkStatus]);

  return {
    bookmarks,
    loading,
    refreshing,
    syncing,
    syncStatus,
    error,
    isLoggedIn,
    isOnline,
    showRetryButton,
    loadBookmarksFromLocal,
    handleRefresh,
    handleToggleBookmark, // Now uses optimistic UI with sync queue
    isNoteBookmarked,
    updateSyncStatus,
    getNetworkSyncState,
  };
}; 