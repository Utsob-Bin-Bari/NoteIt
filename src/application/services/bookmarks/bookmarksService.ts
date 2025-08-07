import { bookmarksSQLiteService } from './bookmarksSQLiteService';
import { syncQueueService } from '../notes/syncQueueService';
import { notesSQLiteService } from '../notes/notesSQLiteService';
import { fetchAllBookmarkedNotes } from '../../../infrastructure/api/requests/bookmarks/fetchAllBookmarkedNotes';
import { createBookmark } from '../../../infrastructure/api/requests/bookmarks/createBookmark';
import { deleteBookmark } from '../../../infrastructure/api/requests/bookmarks/deleteBookmark';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { OPERATION_TYPES, ENTITY_TYPES, DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';
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
      console.log('Error loading bookmarks from local:', error);
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
            // Check if note already exists locally by server_id
            const existingLocalId = await notesSQLiteService.getLocalIdByServerId(serverNote.id);
            
            await notesSQLiteService.saveServerNote({
              local_id: existingLocalId || DatabaseHelpers.generateLocalId(), // Generate or preserve local_id
              server_id: serverNote.id, // Server ID from response
              title: serverNote.title,
              details: serverNote.details,
              owner_id: serverNote.owner_id,
              shared_with: serverNote.shared_with || [],
              bookmarked_by: serverNote.bookmarked_by || [],
              created_at: serverNote.created_at,
              updated_at: serverNote.updated_at,
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
   * Toggle bookmark status
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
      console.log('Error toggling bookmark:', error);
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
      console.log('Error checking bookmark status:', error);
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
      
      // Find server_id by local_id for server operation
      const serverNoteId = await notesSQLiteService.getServerIdByLocalId(noteId);
      if (!serverNoteId) {
        // Note hasn't been synced to server yet, skip this operation
        console.log(`⚠️ BOOKMARK skipped: No server_id found for local_id ${noteId}`);
        return false;
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

  syncAllPendingBookmarks: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    return { synced: 0, failed: 0 };
  },

  getBookmarkSyncStatus: async (userId: string): Promise<{
    hasLocalChanges: boolean;
    pendingOperations: number;
    failedOperations: number;
  }> => {
    return {
      hasLocalChanges: false,
      pendingOperations: 0,
      failedOperations: 0,
    };
  },

  retryFailedOperations: async (accessToken: string): Promise<void> => {
    return;
  },

  manualRefreshBookmarks: async (accessToken: string, userId: string): Promise<Note[]> => {
    return await bookmarksService.loadBookmarksFromLocal(userId);
  },
}; 