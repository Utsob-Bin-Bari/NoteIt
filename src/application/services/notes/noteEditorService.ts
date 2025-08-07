import { notesService } from './notesService';
import { notesSQLiteService } from './notesSQLiteService';
import { conflictResolutionService } from './conflictResolutionService';
import { syncQueueService } from './syncQueueService';
import { OPERATION_TYPES, ENTITY_TYPES } from '../../../infrastructure/storage/DatabaseSchema';
import { Note } from '../../../domain/types/store/NotesState';
import { setAllNotes } from '../../store/action/notes/setAllNotes';
import { Dispatch } from 'redux';

/**
 * Business logic service for note editor operations
 */
export const noteEditorService = {
  /**
   * Load a specific note by ID (supports both server ID and local ID)
   */
  loadNoteById: async (noteId: string, userId: string): Promise<Note | null> => {
    try {
      const notes = await notesSQLiteService.fetchAllNotes(userId);
      
      // Search by local_id (primary identifier for all local operations)
      const foundNote = notes.find(note => note.local_id === noteId);
      
      return foundNote || null;
    } catch (error) {
      console.log('Error loading note by ID:', error);
      return null;
    }
  },

  /**
   * Validate note data before saving
   */
  validateNote: (title: string, details: string): { 
    isValid: boolean; 
    error?: string;
  } => {
    // Basic validation
    if (!title.trim() && !details.trim()) {
      return {
        isValid: false,
        error: 'Note cannot be empty'
      };
    }

    if (title.length > 200) {
      return {
        isValid: false,
        error: 'Title cannot exceed 200 characters'
      };
    }

    return { isValid: true };
  },

  /**
   * SAVE NOTE - Following our agreed plan with conflict resolution
   * User Action → Conflict Resolution → SQLite Database → Query Table → Redux Update → UI Refresh
   */
  saveNote: async (
    noteId: string | null,
    title: string,
    details: string,
    userId: string,
    accessToken?: string,
    dispatch?: Dispatch,
    originalNote?: { title: string; details: string }
  ): Promise<{ 
    success: boolean; 
    noteId?: string; 
    error?: string;
    conflictInfo?: { hasConflicts: boolean; conflictDetails: string[] };
  }> => {
    try {

      // Step 1: Validate note data
      const validation = noteEditorService.validateNote(title, details);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const noteData = {
        title: title.trim() || 'New Note',
        details: details.trim()
      };

      let resultNoteId: string;
      let conflictInfo: { hasConflicts: boolean; conflictDetails: string[] } | undefined;

      if (noteId) {
        // UPDATE existing note with conflict resolution
        const updateResult = await noteEditorService.updateNoteWithRedux(
          noteId, 
          noteData, 
          userId, 
          accessToken, 
          dispatch,
          originalNote
        );
        
        if (!updateResult.success) {
          return {
            success: false,
            error: updateResult.error || 'Failed to update note'
          };
        }
        
        resultNoteId = noteId;
        conflictInfo = updateResult.conflictInfo;
      } else {
        // CREATE new note - follow our agreed plan
        resultNoteId = await noteEditorService.createNoteWithRedux(noteData, userId, accessToken, dispatch);
      }
      
      return {
        success: true,
        noteId: resultNoteId,
        conflictInfo
      };
    } catch (error) {
      console.log('❌ Error saving note:', error);
      return {
        success: false,
        error: 'Failed to save note'
      };
    }
  },

  /**
   * CREATE NOTE - Our agreed plan implementation
   * User Action → SQLite Database → Query Table → Redux Update → UI Refresh
   */
  createNoteWithRedux: async (
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string,
    dispatch?: Dispatch
  ): Promise<string> => {
    
    try {
      const localId = await notesSQLiteService.createNote(noteData, userId);

      const queueId = await syncQueueService.addToQueue(
        OPERATION_TYPES.CREATE,
        ENTITY_TYPES.NOTE,
        localId, // Use local ID as entity_id for correlation
        {
          ...noteData,
          localId: localId, // Store local ID for correlation
          userId: userId
        }
      );

      // Step 3: UPDATE Redux with fresh data from SQLite
      if (dispatch) {
        const freshNotes = await notesSQLiteService.fetchAllNotes(userId);
        dispatch(setAllNotes(freshNotes));
      } else {
        console.log('⚠️ No dispatch provided - Redux will not be updated');
      }
      return localId; // Return local ID for UI correlation

    } catch (error) {
      console.log('❌ CREATE NOTE FAILED:', error);
      throw error;
    }
  },

  /**
   * UPDATE NOTE - Our agreed plan implementation with conflict resolution
   * User Action → Conflict Resolution → SQLite Database → Query Table → Redux Update → UI Refresh
   */
  updateNoteWithRedux: async (
    noteId: string,
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string,
    dispatch?: Dispatch,
    originalNote?: { title: string; details: string }
  ): Promise<{
    success: boolean;
    conflictInfo?: { hasConflicts: boolean; conflictDetails: string[] };
    error?: string;
  }> => {
    
    try {
      let finalNoteData = noteData;
      let conflictInfo: { hasConflicts: boolean; conflictDetails: string[] } | undefined;

      // Step 1: Perform conflict resolution if conditions are met
      if (accessToken && originalNote) {
        const resolutionResult = await conflictResolutionService.performConflictResolution(
          noteId,
          noteData,
          originalNote,
          accessToken
        );

        if (resolutionResult.needsResolution) {
          if (resolutionResult.resolvedData) {
            finalNoteData = resolutionResult.resolvedData;
            conflictInfo = resolutionResult.conflictInfo;
            
            // Log conflict resolution details [[memory:4007386]]
            if (conflictInfo?.hasConflicts) {
              console.log('Conflict resolved for note:', noteId, conflictInfo.conflictDetails);
            }
          } else if (resolutionResult.error) {
            console.log('Conflict resolution failed:', resolutionResult.error);
            // Continue with original note data if conflict resolution fails
          }
        }
      }

      // Step 2: Update in SQLite database with resolved data
      await notesSQLiteService.updateNote(noteId, finalNoteData, userId);
      
      // Step 3: Add to sync queue
      const queueId = await syncQueueService.addToQueue(
        OPERATION_TYPES.UPDATE,
        ENTITY_TYPES.NOTE,
        noteId, // Use current noteId (could be local or server ID)
        {
          ...finalNoteData,
          userId: userId
        }
      );

      // Step 4: UPDATE Redux with fresh data from SQLite
      if (dispatch) {
        const freshNotes = await notesSQLiteService.fetchAllNotes(userId);
        dispatch(setAllNotes(freshNotes));
      } else {
        console.log('⚠️ No dispatch provided - Redux will not be updated');
      }

      return {
        success: true,
        conflictInfo
      };

    } catch (error) {
      console.log('❌ UPDATE NOTE FAILED:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get shared users for a note
   */
  getSharedUsers: (note: Note): string[] => {
    try {
      return note.shared_with || [];
    } catch (error) {
      console.log('Error getting shared users:', error);
      return [];
    }
  },

  /**
   * Format note title for display
   */
  formatNoteTitle: (note: Note | null): string => {
    if (!note) return 'New Note';
    return note.title?.trim() || 'Untitled Note';
  }
}; 