import { notesSQLiteService } from './notesSQLiteService';
import { syncQueueService } from './syncQueueService';
import { fetchAllNotes } from '../../../infrastructure/api/requests/notes/fetchAllNotes';
import { createNewNote } from '../../../infrastructure/api/requests/notes/createNewNote';
import { updateNoteById } from '../../../infrastructure/api/requests/notes/updateNoteById';
import { deleteNoteById } from '../../../infrastructure/api/requests/notes/deleteNoteById';
import { shareNoteByEmail } from '../../../infrastructure/api/requests/notes/shareNoteByEmail';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { OPERATION_TYPES, ENTITY_TYPES, DatabaseHelpers } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';

/**
 * Business logic service for notes management
 * ✅ ENABLED: Auto-sync functionality active with proper local_id to server_id mapping
 */
export const notesService = {
  /**
   * Load notes from local database ONLY (no server calls)
   */
  loadNotesFromLocal: async (userId: string): Promise<Note[]> => {
    try {
      const notes = await notesSQLiteService.fetchAllNotes(userId);
      
      return notes;
    } catch (error) {
      console.log('Error loading notes from LOCAL DATABASE:', error);
      return [];
    }
  },

  /**
   * Fetch notes from server manually and sync to local database
   * ✅ ENABLED: Fetches server notes and stores locally
   */
  fetchNotesFromServerManually: async (accessToken: string, userId: string): Promise<Note[]> => {
    try {
      const response = await fetchAllNotes({ accessToken });
      
      // Save server notes to local database with proper dual ID system
      if (response.notes && response.notes.length > 0) {
        for (const serverNote of response.notes) {
          // Check if note already exists locally by server_id
          const existingLocalId = await notesSQLiteService.getLocalIdByServerId(serverNote.id);
          
          const noteWithDualId: Note = {
            local_id: existingLocalId || DatabaseHelpers.generateLocalId(), // Generate or preserve local_id
            server_id: serverNote.id, // Server ID from response
            title: serverNote.title,
            details: serverNote.details,
            owner_id: serverNote.owner_id,
            shared_with: serverNote.shared_with || [],
            bookmarked_by: serverNote.bookmarked_by || [],
            created_at: serverNote.created_at,
            updated_at: serverNote.updated_at,
          };
          await notesSQLiteService.saveServerNote(noteWithDualId);
        }
      }
      
      // Return fresh data from local database
      const finalNotes = await notesSQLiteService.fetchAllNotes(userId);
      return finalNotes;
    } catch (error) {
      // Fallback to local data on error
      return await notesService.loadNotesFromLocal(userId);
    }
  },

  /**
   * Create new note with auto-sync
   * ✅ ENABLED: Creates locally and queues for sync
   */
  createNote: async (
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string
  ): Promise<string> => {
    try {
      // 1. Create in local database with null server ID and local ID for correlation
      const localId = await notesSQLiteService.createNote(noteData, userId);
      
      // 2. Add to sync queue for auto-sync with local ID correlation
      await syncQueueService.addToQueue(
        OPERATION_TYPES.CREATE,
        ENTITY_TYPES.NOTE,
        localId, // Use local ID as entity_id for correlation
        {
          ...noteData,
          localId: localId, // Store local ID for correlation
          userId: userId
        }
      );
      
      // 3. Trigger immediate auto-sync if online and have access token
      if (accessToken) {
        try {
          await notesService.trySyncOperation(localId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      
      return localId; // Return local ID for correlation
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update existing note with auto-sync
   * ✅ ENABLED: Updates locally and queues for sync
   */
  updateNote: async (
    noteId: string,
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string
  ): Promise<void> => {
    try {
      // 1. Update in local database
      await notesSQLiteService.updateNote(noteId, noteData, userId);
      
      // 2. Add to sync queue for auto-sync
      // Note: For UPDATE operations, we use the current note ID (could be local or server ID)
      await syncQueueService.addToQueue(
        OPERATION_TYPES.UPDATE,
        ENTITY_TYPES.NOTE,
        noteId, // Use current note ID (local or server)
        {
          ...noteData,
          userId: userId
        }
      );
      
      // 3. Trigger immediate auto-sync if online and have access token
      if (accessToken) {
        try {
          await notesService.trySyncOperation(noteId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      
    } catch (error) {
      throw error;
    }
  },

  /**
   * Manual refresh with full sync
   * ✅ ENABLED: Syncs pending changes and fetches server data
   */
  manualRefreshNotes: async (accessToken: string, userId: string): Promise<Note[]> => {
    try {
      // 1. Sync pending local changes first
      await notesService.manualSyncAllPending(accessToken);
      
      // 2. Fetch fresh data from server
      return await notesService.fetchNotesFromServerManually(accessToken, userId);
    } catch (error) {
      // Fallback to local data
      return await notesService.loadNotesFromLocal(userId);
    }
  },



  /**
   * Try to sync a specific operation
   * ✅ ENABLED: Syncs individual operations with proper error handling
   */
  trySyncOperation: async (noteId: string, accessToken: string): Promise<boolean> => {
    let operation: any = null;
    
    try {
      const isOnline = await NetworkService.checkInternetReachability();
      if (!isOnline) return false;

      const pendingOperations = await syncQueueService.getPendingOperations();
      operation = pendingOperations.find(op => op.entity_id === noteId);
      
      if (!operation) return true; // Already synced
      
      let success = false;
      
      try {
        switch (operation.operation_type) {
          case OPERATION_TYPES.CREATE:
            const createPayload = JSON.parse(operation.payload || '{}');
            const localId = operation.entity_id; // Queue always uses local_id as entity_id
            
            const createResponse = await createNewNote({
              requestBody: {
                title: createPayload.title,
                details: createPayload.details,
              },
              accessToken
            });
            
            // CRITICAL: Store server_id for local_id but keep local_id as primary
            if (createResponse.note && createResponse.note.id) {
              // Update the note with server_id but keep local_id as primary
              await notesSQLiteService.updateServerIdByLocalId(localId, createResponse.note.id);
              
              // Mark note as synced using local_id (queue always works with local_id)
              await notesSQLiteService.markNoteSynced(localId, {
                title: createResponse.note.title,
                details: createResponse.note.details,
                owner_id: createResponse.note.owner_id,
                shared_with: createResponse.note.shared_with,
                bookmarked_by: createResponse.note.bookmarked_by,
                created_at: createResponse.note.created_at,
                updated_at: createResponse.note.updated_at,
              });
            } else {
              console.log('❌ Server response missing note ID');
              throw new Error('Server response missing note ID');
            }
            
            success = true;
            break;
            
          case OPERATION_TYPES.UPDATE:
            const updatePayload = JSON.parse(operation.payload || '{}');
            const updateLocalId = operation.entity_id; // Queue always uses local_id as entity_id
            
            // Find server_id by local_id for server operation
            const updateServerId = await notesSQLiteService.getServerIdByLocalId(updateLocalId);
            if (!updateServerId) {
              // Note hasn't been synced to server yet, skip this operation
              console.log(`⚠️ UPDATE skipped: No server_id found for local_id ${updateLocalId}`);
              return false;
            }
            
            const updateResponse = await updateNoteById({
              noteId: updateServerId, // Use server_id for server operation
              requestBody: {
                title: updatePayload.title,
                details: updatePayload.details,
              },
              accessToken
            });
            
            // Update local note with server response data using local_id
            if (updateResponse.note) {
              await notesSQLiteService.markNoteSynced(updateLocalId, {
                title: updateResponse.note.title,
                details: updateResponse.note.details,
                updated_at: updateResponse.note.updated_at,
              });
            }
            
            success = true;
            break;
            
          case OPERATION_TYPES.DELETE:
            const deleteLocalId = operation.entity_id; // Queue always uses local_id as entity_id
            
            // Find server_id by local_id for server operation
            const deleteServerId = await notesSQLiteService.getServerIdByLocalId(deleteLocalId);
            if (!deleteServerId) {
              // Note hasn't been synced to server yet, just remove locally
              console.log(`⚠️ DELETE: No server_id found for local_id ${deleteLocalId}, removing locally only`);
              await notesSQLiteService.permanentlyDeleteNote(deleteLocalId);
              success = true;
              break;
            }
            
            // Delete from server using server_id
            await deleteNoteById({ noteId: deleteServerId, accessToken });
            
            // After successful server delete, permanently remove from local database using local_id
            await notesSQLiteService.permanentlyDeleteNote(deleteLocalId);
            
            success = true;
            break;
            
          case OPERATION_TYPES.SHARE:
            const sharePayload = JSON.parse(operation.payload || '{}');
            const shareLocalId = operation.entity_id; // Queue always uses local_id as entity_id
            
            // Find server_id by local_id for server operation
            const shareServerId = await notesSQLiteService.getServerIdByLocalId(shareLocalId);
            if (!shareServerId) {
              // Note hasn't been synced to server yet, skip this operation
              console.log(`⚠️ SHARE skipped: No server_id found for local_id ${shareLocalId}`);
              return false;
            }
            
            // Share using server_id
            await shareNoteByEmail({
              noteId: shareServerId,
              requestBody: {
                email: sharePayload.email,
              },
              accessToken
            });
            success = true;
            break;
        }
      } catch (apiError: any) {
        // Enhanced 404 error detection - handle multiple error formats
        const is404Error = (
          apiError.response?.status === 404 ||           // Standard axios error format
          apiError.status === 404 ||                     // Direct status property
          (apiError.message && (
            apiError.message.includes('Note not found on server (404)') ||
            apiError.message.includes('Request failed with status code 404') ||
            apiError.message.includes('404')
          )) ||
          (apiError.response?.data?.errors?.message && 
           apiError.response.data.errors.message.includes('Note not found'))
        );
        
        if (operation.operation_type === OPERATION_TYPES.DELETE && is404Error) {
          // Note doesn't exist on server, permanently delete from local database
          await notesSQLiteService.permanentlyDeleteNote(operation.entity_id);
          success = true; // Treat as successful since note doesn't exist anyway
        } else {
          throw apiError; // Re-throw other errors
        }
      }
      
      if (success) {
        await syncQueueService.markOperationCompleted(operation.id);
        
        // Note: For CREATE operations, the note is already marked as synced in the switch case above
        // For UPDATE operations, mark as synced with just the sync status (no data override)
        // For DELETE operations, no need to mark as synced (note is deleted)
        if (operation.operation_type === OPERATION_TYPES.UPDATE) {
          try {
            await notesSQLiteService.markNoteSynced(noteId);
          } catch (markSyncError) {
            // This is not critical - the operation was successful on server
          }
        }
      }
      
      return success;
    } catch (error: any) {
      console.log('Error syncing operation:', {
        noteId,
        operation: operation?.operation_type,
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  },

  syncAllPending: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    return { synced: 0, failed: 0 };
  },

  /**
   * Manual sync all pending operations
   * ✅ ENABLED: Processes all pending queue operations
   */
  manualSyncAllPending: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    try {
      const pendingOperations = await syncQueueService.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      // Process operations in FIFO order - stop on first failure
      for (const operation of pendingOperations) {
        try {
          const success = await notesService.trySyncOperation(operation.entity_id, accessToken);
          
          if (success) {
            await syncQueueService.markOperationCompleted(operation.id);
            synced++;
          } else {
            await syncQueueService.incrementRetryCount(operation.id);
            failed++;
            // Stop on first failure to maintain order
            break;
          }
          
          // Add delay between operations
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`Error syncing operation ${operation.id}:`, error);
          await syncQueueService.incrementRetryCount(operation.id);
          failed++;
          // Stop on error to maintain order
          break;
        }
      }

      return { synced, failed };
    } catch (error) {
      console.log('Error in manual sync all pending:', error);
      return { synced: 0, failed: 0 };
    }
  },

  /**
   * Get sync status information
   * ✅ ENABLED: Returns actual sync status from queue
   */
  getSyncStatus: async (): Promise<{
    hasLocalChanges: boolean;
    pendingOperations: number;
    failedOperations: number;
  }> => {
    try {
      const queueStatus = await syncQueueService.getQueueStatus();
      
      return {
        hasLocalChanges: queueStatus.pending > 0 || queueStatus.failed > 0,
        pendingOperations: queueStatus.pending,
        failedOperations: queueStatus.failed,
      };
    } catch (error) {
      console.log('Error getting sync status:', error);
      return {
        hasLocalChanges: false,
        pendingOperations: 0,
        failedOperations: 0,
      };
    }
  },

  /**
   * Retry failed operations manually
   * ✅ ENABLED: Resets failed operations and triggers sync
   */
  retryFailedOperations: async (accessToken: string): Promise<void> => {
    try {
      const failedOperations = await syncQueueService.getFailedOperations();
      
      for (const operation of failedOperations) {
        await syncQueueService.resetFailedOperation(operation.id);
      }
      
      await notesService.manualSyncAllPending(accessToken);
    } catch (error) {
      console.log('Error retrying failed operations:', error);
    }
  },

  /**
   * Manual refresh notes data - syncs pending changes then fetches from server
   * ✅ ENABLED: Full sync and refresh functionality
   */
  refreshNotes: async (accessToken: string, userId: string): Promise<Note[]> => {
    try {
      // First sync any pending changes
      await notesService.manualSyncAllPending(accessToken);
      
      // Then fetch fresh data from server manually
      return await notesService.fetchNotesFromServerManually(accessToken, userId);
    } catch (error) {
      console.log('Error in manual refresh:', error);
      // Fallback to local data
      return await notesService.loadNotesFromLocal(userId);
    }
  },
}; 