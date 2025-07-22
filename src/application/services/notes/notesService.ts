import { notesSQLiteService } from './notesSQLiteService';
// 🚨 DISABLED: Auto-sync functionality removed
// import { syncQueueService } from './syncQueueService';
import { fetchAllNotes } from '../../../infrastructure/api/requests/notes/fetchAllNotes';
import { createNewNote } from '../../../infrastructure/api/requests/notes/createNewNote';
import { updateNoteById } from '../../../infrastructure/api/requests/notes/updateNoteById';
import { deleteNoteById } from '../../../infrastructure/api/requests/notes/deleteNoteById';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';

/**
 * Business logic service for notes management
 * 🚨 DISABLED: Auto-sync functionality removed - operating in local-only mode
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
      console.error('❌ Error loading notes from LOCAL DATABASE:', error);
      return [];
    }
  },

  /**
   * Fetch notes from server MANUALLY ONLY (no auto-calls)
   * 🚨 DISABLED: Server requests commented out for local-only operation
   */
  fetchNotesFromServerManually: async (accessToken: string, userId: string): Promise<Note[]> => {
    // 🚨 DISABLED: Server requests commented out for local-only operation
    return await notesService.loadNotesFromLocal(userId);
    
    /*
    // TODO: Uncomment for future server sync implementation
    try {
      
      const response = await fetchAllNotes({ accessToken });
      
      // Save server notes to local database
      if (response.notes && response.notes.length > 0) {
        
        for (const serverNote of response.notes) {
          // Add local_id as null for server notes to match Note interface
          const noteWithLocalId: Note = {
            ...serverNote,
            local_id: null
          };
          await notesSQLiteService.saveServerNote(noteWithLocalId);
        }
      }
      
      // Return fresh data from local database
      const finalNotes = await notesSQLiteService.fetchAllNotes(userId);
      
      return finalNotes;
    } catch (error) {
      console.error('❌ Error fetching notes from BACKEND SERVER (manual):', error);
      throw error;
    }
    */
  },

  /**
   * Create new note (LOCAL ONLY - no sync)
   * 🚨 DISABLED: Auto-sync functionality removed
   */
  createNote: async (
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string
  ): Promise<string> => {
    try {
      // 1. Create in local database with null server ID and local ID for correlation
      const localId = await notesSQLiteService.createNote(noteData, userId);
      
      /*
      // TODO: Uncomment for future auto-sync implementation
      // 2. Add to sync queue for auto-sync with local ID correlation
      const queueId = await syncQueueService.addToQueue(
        OPERATION_TYPES.CREATE,
        ENTITY_TYPES.NOTE,
        localId, // Use local ID as entity_id for correlation
        noteData
      );
      
      // 3. Trigger immediate auto-sync if online and have access token
      if (accessToken) {
        try {
          await notesService.trySyncOperation(localId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      */
      
      return localId; // Return local ID for correlation
    } catch (error) {
      console.error('❌ Error creating note:', error);
      throw error;
    }
  },

  /**
   * Update existing note (LOCAL ONLY - no sync)
   * 🚨 DISABLED: Auto-sync functionality removed
   */
  updateNote: async (
    noteId: string,
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string
  ): Promise<void> => {
    try {
      // 1. Update in local database only
      await notesSQLiteService.updateNote(noteId, noteData, userId);
      
      /*
      // TODO: Uncomment for future auto-sync implementation
      // 2. Add to sync queue for auto-sync
      // Note: For UPDATE operations, we use the current note ID (could be local or server ID)
      const queueId = await syncQueueService.addToQueue(
        OPERATION_TYPES.UPDATE,
        ENTITY_TYPES.NOTE,
        noteId, // Use current note ID (local or server)
        noteData
      );
      
      // 3. Trigger immediate auto-sync if online and have access token
      if (accessToken) {
        try {
          await notesService.trySyncOperation(noteId, accessToken);
        } catch (syncError) {
          // Auto-sync failed, will retry later
        }
      }
      */
      
    } catch (error) {
      console.error('❌ Error updating note:', error);
      throw error;
    }
  },

  /**
   * Manual refresh (returns local data only)
   * 🚨 DISABLED: Server sync functionality removed
   */
  manualRefreshNotes: async (accessToken: string, userId: string): Promise<Note[]> => {
    // 🚨 DISABLED: Server sync functionality removed for local-only operation
    return await notesService.loadNotesFromLocal(userId);
    
    /*
    // TODO: Uncomment for future server sync implementation
    try {
      
      // 1. Sync pending local changes first
      await notesService.manualSyncAllPending(accessToken);
      
      // 2. Fetch fresh data from server
      return await notesService.fetchNotesFromServerManually(accessToken, userId);
    } catch (error) {
      console.error('❌ Error in manual refresh:', error);
      // Fallback to local data
      return await notesService.loadNotesFromLocal(userId);
    }
    */
  },

  /**
   * Manual sync all pending operations (DISABLED - returns mock data)
   * 🚨 DISABLED: Sync functionality removed
   */
  manualSyncAllPending: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return { synced: 0, failed: 0 };
    
    /*
    // TODO: Uncomment for future sync implementation
    
    const pendingOperations = await syncQueueService.getPendingOperations();
    let synced = 0;
    let failed = 0;
    
    
    for (const operation of pendingOperations) {
      try {
        const success = await notesService.trySyncOperation(operation.entity_id, accessToken);
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
   * Try to sync a specific operation (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  trySyncOperation: async (noteId: string, accessToken: string): Promise<boolean> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return true;
    
    /*
    // TODO: Uncomment for future sync implementation
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
            const localId = createPayload.localId || operation.entity_id; // Get local ID from payload
            
            
            const createResponse = await createNewNote({
              requestBody: {
                title: createPayload.title,
                details: createPayload.details,
              },
              accessToken
            });
            
            // CRITICAL: Update local note ID to match server ID using local ID correlation
            if (createResponse.note && createResponse.note.id) {
              
              // Update the note with server ID using local ID correlation
              await notesSQLiteService.updateLocalIdToServerId(localId, createResponse.note.id);
              
              // Update sync queue to reference the new server ID
              await syncQueueService.updateEntityId(operation.id, createResponse.note.id);
              
              // Mark with server data using the NEW server ID
              await notesSQLiteService.markNoteSynced(createResponse.note.id, {
                title: createResponse.note.title,
                details: createResponse.note.details,
                owner_id: createResponse.note.owner_id,
                shared_with: createResponse.note.shared_with,
                bookmarked_by: createResponse.note.bookmarked_by,
                created_at: createResponse.note.created_at,
                updated_at: createResponse.note.updated_at,
              });
              
            } else {
              console.error('❌ Server response missing note ID');
              throw new Error('Server response missing note ID');
            }
            
            success = true;
            break;
            
          case OPERATION_TYPES.UPDATE:
            const updatePayload = JSON.parse(operation.payload || '{}');
            
            // For UPDATE operations, the entity_id could be local ID or server ID
            // We need to handle both cases
            let updateNoteId = operation.entity_id;
            
            // Check if this is a local ID that needs to be converted to server ID
            if (updateNoteId.startsWith('local_')) {
              // This is an edge case - local ID for UPDATE without CREATE being processed
              // We should skip this operation until CREATE is processed
              return false;
            }
            
            
            const updateResponse = await updateNoteById({
              noteId: updateNoteId,
              requestBody: {
                title: updatePayload.title,
                details: updatePayload.details,
              },
              accessToken
            });
            
            // Update local note with server response data
            if (updateResponse.note) {
              await notesSQLiteService.markNoteSynced(updateNoteId, {
                title: updateResponse.note.title,
                details: updateResponse.note.details,
                updated_at: updateResponse.note.updated_at,
              });
            }
            
            success = true;
            break;
            
          case OPERATION_TYPES.DELETE:
            // For DELETE operations, the entity_id could be local ID or server ID
            let deleteNoteId = operation.entity_id;
            
            // Check if this is a local ID that needs to be converted to server ID
            if (deleteNoteId.startsWith('local_')) {
              // This is an edge case - local ID for DELETE without CREATE being processed
              // We should skip this operation until CREATE is processed
              return false;
            }
            
            await deleteNoteById({ noteId: deleteNoteId, accessToken });
            success = true;
            break;
        }
      } catch (apiError: any) {
          noteId,
          operation_type: operation.operation_type,
          error_details: {
            status: apiError.status,
            response_status: apiError.response?.status,
            message: apiError.message,
            response_data: apiError.response?.data,
            full_error: apiError
          }
        });
        
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
        
          is404Error,
          operation_type: operation.operation_type,
          noteId
        });
        
        if (operation.operation_type === OPERATION_TYPES.DELETE && is404Error) {
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
        } else if (operation.operation_type === OPERATION_TYPES.CREATE) {
        } else if (operation.operation_type === OPERATION_TYPES.DELETE) {
        }
      }
      
      return success;
    } catch (error: any) {
      console.error('Error syncing operation:', {
        noteId,
        operation: operation?.operation_type,
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
    */
  },

  /**
   * Sync all pending operations (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  syncAllPending: async (accessToken: string): Promise<{synced: number, failed: number}> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return { synced: 0, failed: 0 };
    
    /*
    // TODO: Uncomment for future sync implementation
    const pendingOperations = await syncQueueService.getPendingOperations();
    let synced = 0;
    let failed = 0;
    
    for (const operation of pendingOperations) {
      try {
        const success = await notesService.trySyncOperation(operation.entity_id, accessToken);
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
   * Get sync status information (DISABLED - returns mock data)
   * 🚨 DISABLED: Sync functionality removed
   */
  getSyncStatus: async (): Promise<{
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
    
    return {
      hasLocalChanges: queueStatus.pending > 0 || queueStatus.failed > 0,
      pendingOperations: queueStatus.pending,
      failedOperations: queueStatus.failed,
    };
    */
  },

  /**
   * Retry failed operations manually (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  retryFailedOperations: async (accessToken: string): Promise<void> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return;
    
    /*
    // TODO: Uncomment for future sync implementation
    const failedOperations = await syncQueueService.getFailedOperations();
    
    for (const operation of failedOperations) {
      await syncQueueService.resetFailedOperation(operation.id);
    }
    
    await notesService.syncAllPending(accessToken);
    */
  },

  /**
   * Debug function specifically for duplicate operations (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  debugDuplicateOperations: async (noteId?: string): Promise<void> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return;
    
    /*
    // TODO: Uncomment for future sync implementation
    try {
      
      const pendingOps = await syncQueueService.getPendingOperations();
      
      if (noteId) {
        const noteOps = pendingOps.filter(op => op.entity_id === noteId);
        noteOps.forEach((op, index) => {
        });
      } else {
        // Group by entity_id and operation_type to find duplicates
        const grouped: { [key: string]: any[] } = {};
        pendingOps.forEach(op => {
          const key = `${op.entity_id}_${op.operation_type}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(op);
        });
        
        Object.entries(grouped).forEach(([key, ops]) => {
          if (ops.length > 1) {
            ops.forEach(op => {
            });
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error debugging duplicates:', error);
    }
    */
  },

  /**
   * Debug function to check sync status and queue (DISABLED)
   * 🚨 DISABLED: Sync functionality removed
   */
  debugSyncStatus: async (): Promise<void> => {
    // 🚨 DISABLED: Sync functionality removed for local-only operation
    return;
    
    /*
    // TODO: Uncomment for future sync implementation
    try {
      
      const queueStatus = await syncQueueService.getQueueStatus();
      
      const pendingOps = await syncQueueService.getPendingOperations();
      
      pendingOps.forEach((op, index) => {
          id: op.id,
          type: op.operation_type,
          entity: op.entity_type,
          entity_id: op.entity_id,
          status: op.status,
          retry_count: op.retry_count,
          created_at: op.created_at,
          payload: op.payload
        });
      });
      
      const failedOps = await syncQueueService.getFailedOperations();
      
      failedOps.forEach((op, index) => {
          id: op.id,
          type: op.operation_type,
          entity: op.entity_type,
          entity_id: op.entity_id,
          status: op.status,
          retry_count: op.retry_count,
          created_at: op.created_at,
          payload: op.payload
        });
      });
      
    } catch (error) {
      console.error('❌ Error checking sync status:', error);
    }
    */
  },

  /**
   * Manual refresh notes data (returns local data only)
   * 🚨 DISABLED: Server sync functionality removed
   */
  refreshNotes: async (accessToken: string, userId: string): Promise<Note[]> => {
    // 🚨 DISABLED: Server sync functionality removed for local-only operation
    return await notesService.loadNotesFromLocal(userId);
    
    /*
    // TODO: Uncomment for future server sync implementation
    try {
      
      // First sync any pending changes
      await notesService.manualSyncAllPending(accessToken);
      
      // Then fetch fresh data from server manually
      return await notesService.fetchNotesFromServerManually(accessToken, userId);
    } catch (error) {
      console.error('❌ Error in manual refresh:', error);
      // Fallback to local data
      return await notesService.loadNotesFromLocal(userId);
    }
    */
  },
}; 