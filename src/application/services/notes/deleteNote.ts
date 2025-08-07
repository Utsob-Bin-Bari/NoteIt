import { notesSQLiteService } from './notesSQLiteService';
import { syncQueueService } from './syncQueueService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../../infrastructure/storage/DatabaseSchema';
import { deleteNote as deleteNoteAction } from '../../store/action/notes/deleteNote';
import { setAllNotes } from '../../store/action/notes/setAllNotes';
import { deleteNoteById } from '../../../infrastructure/api/requests/notes/deleteNoteById';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';
import { validateNoteOwnershipById } from '../../../domain/validators/noteOwnershipValidator';
import { Dispatch } from 'redux';

/**
 * DELETE NOTE - Soft Delete Implementation for Sync Integrity
 * User Action → Soft Delete in SQLite → Queue for Sync → Redux Update → UI Refresh
 * Note: Soft delete preserves server ID for sync queue processing
 */
export const deleteNote = async (
  noteId: string,
  userId: string,
  dispatch?: Dispatch,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> => {

  try {
    // Step 1: Validate note ownership before deletion
    const allNotes = await notesSQLiteService.fetchAllNotes(userId);
    const ownershipValidation = validateNoteOwnershipById(noteId, userId, allNotes);
    
    if (!ownershipValidation.isOwner) {
      // Check if this note was already soft deleted by getting ALL notes (including deleted ones)
      const allNotesIncludingDeleted = await notesSQLiteService.getSoftDeletedNotes();
      const alreadyDeletedNote = allNotesIncludingDeleted.find(note => 
        note.local_id === noteId && note.owner_id === userId
      );
      
      if (alreadyDeletedNote) {
        // Note is already soft deleted by this user - treat as successful operation
        return { success: true };
      }
      
      return {
        success: false,
        error: ownershipValidation.error || 'Only owner can delete the note'
      };
    }

    // Step 2: Proceed with soft delete if ownership is validated (preserves server ID for sync)
    await notesSQLiteService.deleteNote(noteId);

    const queueId = await syncQueueService.addToQueue(
      OPERATION_TYPES.DELETE,
      ENTITY_TYPES.NOTE,
      noteId,
      {
        userId: userId,
        deletedAt: new Date().toISOString()
      }
    );

    // Step 3: UPDATE Redux with fresh data from SQLite
    if (dispatch) {
      
      dispatch(deleteNoteAction(noteId));
      setTimeout(async () => {
        try {
          const freshNotes = await notesSQLiteService.fetchAllNotes(userId);
          dispatch(setAllNotes(freshNotes));
        } catch (refreshError) {
          console.log('⚠️ Failed to refresh Redux after delete:', refreshError);
        }
      }, 100);
    } else {
      console.log('⚠️ No dispatch provided - Redux will not be updated');
    }

    return { success: true };

  } catch (error: any) {
    
    // If SQLite delete failed, we need to handle potential inconsistency
    if (dispatch) {
      try {
        // Refresh Redux from SQLite to ensure consistency
        const currentNotes = await notesSQLiteService.fetchAllNotes(userId);
        dispatch(setAllNotes(currentNotes));
      } catch (restoreError) {
        console.log('❌ Failed to restore Redux state:', restoreError);
      }
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to delete note' 
    };
  }
};

/**
 * ✅ VERIFICATION FUNCTION: Test delete flow integrity
 * This function helps verify that all steps of the delete flow work correctly
 */
export const verifyDeleteFlow = async (userId: string): Promise<{
  success: boolean;
  details: {
    beforeCount: number;
    afterCount: number;
    queueOperations: number;
    deletedNoteId?: string;
  };
}> => {
  try {
    
    // Step 1: Get initial state
    const initialNotes = await notesSQLiteService.fetchAllNotes(userId);
    const initialQueueOps = await syncQueueService.getAllOperations();

    
    if (initialNotes.length === 0) {
      return {
        success: false,
        details: {
          beforeCount: 0,
          afterCount: 0,
          queueOperations: initialQueueOps.length
        }
      };
    }
    
    // Step 2: Delete the first note
    const noteToDelete = initialNotes[0];
    
    const deleteResult = await deleteNote(noteToDelete.local_id, userId);
    
    if (!deleteResult.success) {
      console.log('❌ VERIFY: Delete operation failed');
      return {
        success: false,
        details: {
          beforeCount: initialNotes.length,
          afterCount: initialNotes.length,
          queueOperations: initialQueueOps.length
        }
      };
    }
    
    // Step 3: Verify final state
    const finalNotes = await notesSQLiteService.fetchAllNotes(userId);
    const finalQueueOps = await syncQueueService.getAllOperations();
    
    const success = (
      finalNotes.length === initialNotes.length - 1 &&
      finalQueueOps.length === initialQueueOps.length + 1
    );
    
    
    return {
      success,
      details: {
        beforeCount: initialNotes.length,
        afterCount: finalNotes.length,
        queueOperations: finalQueueOps.length,
        deletedNoteId: noteToDelete.local_id
      }
    };
    
  } catch (error) {
    console.log('❌ VERIFY: Delete flow verification failed:', error);
    return {
      success: false,
      details: {
        beforeCount: 0,
        afterCount: 0,
        queueOperations: 0
      }
    };
  }
}; 