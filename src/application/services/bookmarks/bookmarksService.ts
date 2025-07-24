import { bookmarksSQLiteService } from './bookmarksSQLiteService';
import { syncQueueService } from '../notes/syncQueueService';
import { notesSQLiteService } from '../notes/notesSQLiteService';
import { fetchAllBookmarkedNotes } from '../../../infrastructure/api/requests/bookmarks/fetchAllBookmarkedNotes';
import { createBookmark } from '../../../infrastructure/api/requests/bookmarks/createBookmark';
import { deleteBookmark } from '../../../infrastructure/api/requests/bookmarks/deleteBookmark';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';

/**
 * Business logic service for bookmarks management
 * ✅ ENABLED: Auto-sync functionality active with proper local_id to server_id mapping
 */
export const bookmarksService = {
  /**
   * Load bookmarks from local database ONLY (no server calls)
   */
  loadBookmarksFromLocal: async (userId: string): Promise<Note[]> => {
    try {
      const bookmarks = await bookmarksSQLiteService.fetchBookmarkedNotes(userId);
      return bookmarks;
    } catch (error) {
      console.error('Error loading bookmarks from local:', error);
      return [];
    }
  },

  /**
   * Refresh bookmarks from server with sync
   * ✅ ENABLED: Fetches server bookmarks and stores locally
   */
  refreshBookmarks: async (accessToken: string, userId: string): Promise<Note[]> => {
    try {
      const response = await fetchAllBookmarkedNotes({ accessToken });
      
      if (response.notes && response.notes.length > 0) {
        for (const serverNote of response.notes) {
          try {
            await notesSQLiteService.saveServerNote({
              ...serverNote,
              local_id: null
            });
          } catch (error) {
            // Continue with other notes if one fails
          }
        }
      }
      
      return await bookmarksService.loadBookmarksFromLocal(userId);
    } catch (error) {
      // Fallback to local data
      return await bookmarksService.loadBookmarksFromLocal(userId);
    }
  },

  /**
   * Add bookmark with auto-sync
   * ✅ ENABLED: Adds locally and queues for sync
   */
  addBookmark: async (
    noteId: string,
    userId: string,
    accessToken?: string
  ): Promise<void> => {
    try {
      await bookmarksSQLiteService.addBookmark(noteId, userId);
      
      await syncQueueService.addToQueue(
        OPERATION_TYPES.BOOKMARK,
        ENTITY_TYPES.NOTE,
        noteId,
        { 
          userId: userId,
          noteId: noteId
        }
      );
      
      if (accessToken) {
        try {
          await bookmarksService.trySyncBookmarkOperation(noteId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove bookmark with auto-sync
   * ✅ ENABLED: Removes locally and queues for sync
   */
  removeBookmark: async (
    noteId: string,
    userId: string,
    accessToken?: string
  ): Promise<void> => {
    try {
      await bookmarksSQLiteService.removeBookmark(noteId, userId);
      
      await syncQueueService.addToQueue(
        OPERATION_TYPES.UNBOOKMARK,
        ENTITY_TYPES.NOTE,
        noteId,
        { 
          userId: userId,
          noteId: noteId
        }
      );
      
      if (accessToken) {
        try {
          await bookmarksService.trySyncBookmarkOperation(noteId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle bookmark status (LOCAL ONLY - no sync)
   * 🚨 DISABLED: Auto-sync functionality removed
   */
  toggleBookmark: async (
    noteId: string,
    userId: string,
    accessToken?: string
  ): Promise<boolean> => {
    try {
      const isBookmarked = await bookmarksService.isNoteBookmarked(noteId, userId);
      
      if (isBookmarked) {
        await bookmarksService.removeBookmark(noteId, userId, accessToken);
        return false;
      } else {
        await bookmarksService.addBookmark(noteId, userId, accessToken);
        return true;
      }
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  },

  /**
   * Check if note is bookmarked
   */
  isNoteBookmarked: async (noteId: string, userId: string): Promise<boolean> => {
    try {
      return await bookmarksSQLiteService.isNoteBookmarked(noteId, userId);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },

  /**
   * Try to sync a specific bookmark operation
   * ✅ ENABLED: Syncs bookmark operations with proper local_id to server_id handling
   */
  trySyncBookmarkOperation: async (noteId: string, accessToken: string): Promise<boolean> => {
    try {
      const pendingOperations = await syncQueueService.getPendingOperations();
      const operation = pendingOperations.find(
        op => op.entity_id === noteId && op.entity_type === ENTITY_TYPES.NOTE && 
        (op.operation_type === OPERATION_TYPES.BOOKMARK || op.operation_type === OPERATION_TYPES.UNBOOKMARK)
      );
      
      if (!operation) return true; // Already synced
      
      // Check if we need to convert local_id to server_id
      let serverNoteId = noteId;
      if (noteId.startsWith('local_')) {
        // Find server_id from local_id in notes table
        const notes = await notesSQLiteService.fetchAllNotes(''); // Get all notes to find by local_id
        const note = notes.find(n => n.local_id === noteId);
        if (!note || !note.id || note.id.startsWith('local_')) {
          // Server ID not available yet, skip sync
          return false;
        }
        serverNoteId = note.id;
      }
      
      let success = false;
      
      if (operation.operation_type === OPERATION_TYPES.BOOKMARK) {
        await createBookmark({ noteId: serverNoteId, accessToken });
        success = true;
      } else if (operation.operation_type === OPERATION_TYPES.UNBOOKMARK) {
        await deleteBookmark({ noteId: serverNoteId, accessToken });
        success = true;
      }
      
      if (success) {
        await syncQueueService.markOperationCompleted(operation.id);
        await bookmarksSQLiteService.markBookmarkSynced(noteId);
      }
      
      return success;
    } catch (error) {
      return false;
    }
  },

  /**
   * Sync all pending bookmark operations (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  syncAllPendingBookmarks: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return { synced: 0, failed: 0 };
    
    /*
    // TODO: Uncomment for future sync implementation
    const pendingOperations = await syncQueueService.getPendingOperations();
    const bookmarkOps = pendingOperations.filter(op => op.entity_type === ENTITY_TYPES.BOOKMARK);
    
    let synced = 0;
    let failed = 0;
    
    for (const operation of bookmarkOps) {
      try {
        const success = await bookmarksService.trySyncBookmarkOperation(operation.entity_id, accessToken);
        if (success) {
          synced++;
        } else {
          failed++;
          await syncQueueService.incrementRetryCount(operation.id);
        }
      } catch (error) {
        failed++;
        await syncQueueService.incrementRetryCount(operation.id);
      }
    }
    
    return { synced, failed };
    */
  },

  /**
   * Get bookmark sync status information (DISABLED - returns mock data)
   * 🚨 DISABLED: Sync functionality removed
   */
  getBookmarkSyncStatus: async (userId: string): Promise<{
    hasLocalChanges: boolean;
    pendingOperations: number;
    failedOperations: number;
  }> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return {
      hasLocalChanges: false,
      pendingOperations: 0,
      failedOperations: 0,
    };
    
    /*
    // TODO: Uncomment for future sync implementation
    const queueStatus = await syncQueueService.getQueueStatus();
    const pendingOps = await syncQueueService.getPendingOperations();
    const bookmarkOps = pendingOps.filter(op => op.entity_type === ENTITY_TYPES.BOOKMARK);
    
    return {
      hasLocalChanges: bookmarkOps.length > 0,
      pendingOperations: bookmarkOps.length,
      failedOperations: queueStatus.failed,
    };
    */
  },

  /**
   * Retry failed bookmark operations (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  retryFailedOperations: async (accessToken: string): Promise<void> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return;
    
    /*
    // TODO: Uncomment for future sync implementation
    const failedOps = await syncQueueService.getFailedOperations();
    const bookmarkOps = failedOps.filter(op => op.entity_type === ENTITY_TYPES.BOOKMARK);
    
    for (const operation of bookmarkOps) {
      await syncQueueService.resetFailedOperation(operation.id);
    }
    */
  },

  /**
   * Refresh bookmarks manually (DISABLED - returns local data only)
   * 🚨 DISABLED: Server sync functionality removed
   */
  manualRefreshBookmarks: async (accessToken: string, userId: string): Promise<Note[]> => {
    // 🚨 DISABLED: Server sync functionality removed for local-only operation
    return await bookmarksService.loadBookmarksFromLocal(userId);
    
    /*
    // TODO: Uncomment for future server sync implementation
    try {
      return await bookmarksService.refreshBookmarks(accessToken, userId);
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
      // Fallback to local data
      return await bookmarksService.loadBookmarksFromLocal(userId);
    }
    */
  },
}; 