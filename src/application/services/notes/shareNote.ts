import { notesSQLiteService } from './notesSQLiteService';
import { syncQueueService } from './syncQueueService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../../infrastructure/storage/DatabaseSchema';
import { setAllNotes } from '../../store/action/notes/setAllNotes';
import { shareNoteByEmail } from '../../../infrastructure/api/requests/notes/shareNoteByEmail';
import { validateShareEmail } from '../../../domain/validators/shareValidator';
import { Dispatch } from 'redux';

/**
 * SHARE NOTE - Following our agreed architecture pattern
 * User Action → SQLite Database → Redux Update → Sync Queue → UI Refresh
 */
export const shareNote = async (
  noteId: string,
  email: string,
  userId: string,
  dispatch?: Dispatch,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Step 1: Validate input
    if (!noteId || !email.trim() || !userId) {
      return {
        success: false,
        error: 'Missing required information for sharing'
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Use domain-level validation (same as login/signup)
    const validation = validateShareEmail(trimmedEmail);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.fieldErrors.email[0] // Return first error message
      };
    }

    // Step 2: Update local SQLite database
    // First get the current note to update shared_with array
    const notes = await notesSQLiteService.fetchAllNotes(userId);
    const currentNote = notes.find(note => note.id === noteId || note.local_id === noteId);
    
    if (!currentNote) {
      return {
        success: false,
        error: 'Note not found'
      };
    }

    // Check if already shared with this email
    const currentSharedWith = currentNote.shared_with || [];
    if (currentSharedWith.includes(trimmedEmail)) {
      return {
        success: false,
        error: 'Note is already shared with this email'
      };
    }

    // Add email to shared_with array
    const updatedSharedWith = [...currentSharedWith, trimmedEmail];
    
    // Update note in local database with shared_with field
    await notesSQLiteService.updateNote(noteId, {
      title: currentNote.title,
      details: currentNote.details,
      shared_with: updatedSharedWith
    }, userId);

    // Step 3: Add to sync queue for later API call
    await syncQueueService.addToQueue(
      OPERATION_TYPES.SHARE, // Assuming this exists or we'll add it
      ENTITY_TYPES.NOTE,
      noteId,
      {
        email: trimmedEmail,
        userId: userId,
        noteId: noteId
      }
    );

    // Step 4: Update Redux with fresh data from SQLite  
    if (dispatch) {
      const freshNotes = await notesSQLiteService.fetchAllNotes(userId);
      dispatch(setAllNotes(freshNotes));
    }
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error sharing note:', error);
    return {
      success: false,
      error: 'Failed to share note. Please try again.'
    };
  }
}; 