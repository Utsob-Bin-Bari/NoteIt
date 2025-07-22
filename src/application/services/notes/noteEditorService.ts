import { notesService } from './notesService';
import { notesSQLiteService } from './notesSQLiteService';
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
   * Load a specific note by ID
   */
  loadNoteById: async (noteId: string, userId: string): Promise<Note | null> => {
    try {
      const notes = await notesSQLiteService.fetchAllNotes(userId);
      return notes.find(note => note.id === noteId) || null;
    } catch (error) {
      console.error('Error loading note by ID:', error);
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
   * SAVE NOTE - Following our agreed plan
   * User Action → SQLite Database → Query Table → Redux Update → UI Refresh
   */
  saveNote: async (
    noteId: string | null,
    title: string,
    details: string,
    userId: string,
    accessToken?: string,
    dispatch?: Dispatch
  ): Promise<{ success: boolean; noteId?: string; error?: string }> => {
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

      if (noteId) {
        // UPDATE existing note - same pattern as create
        await noteEditorService.updateNoteWithRedux(noteId, noteData, userId, accessToken, dispatch);
        resultNoteId = noteId;
      } else {
        // CREATE new note - follow our agreed plan
        resultNoteId = await noteEditorService.createNoteWithRedux(noteData, userId, accessToken, dispatch);
      }
      return {
        success: true,
        noteId: resultNoteId
      };
    } catch (error) {
      console.error('❌ Error saving note:', error);
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
        console.warn('⚠️ No dispatch provided - Redux will not be updated');
      }
      return localId; // Return local ID for UI correlation

    } catch (error) {
      console.error('❌ CREATE NOTE FAILED:', error);
      throw error;
    }
  },

  /**
   * UPDATE NOTE - Our agreed plan implementation
   * User Action → SQLite Database → Query Table → Redux Update → UI Refresh
   */
  updateNoteWithRedux: async (
    noteId: string,
    noteData: { title: string; details: string },
    userId: string,
    accessToken?: string,
    dispatch?: Dispatch
  ): Promise<void> => {
    
    try {

      await notesSQLiteService.updateNote(noteId, noteData, userId);
      const queueId = await syncQueueService.addToQueue(
        OPERATION_TYPES.UPDATE,
        ENTITY_TYPES.NOTE,
        noteId, // Use current noteId (could be local or server ID)
        {
          ...noteData,
          userId: userId
        }
      );

      // Step 3: UPDATE Redux with fresh data from SQLite
      if (dispatch) {
        const freshNotes = await notesSQLiteService.fetchAllNotes(userId);
        dispatch(setAllNotes(freshNotes));
      } else {
        console.warn('⚠️ No dispatch provided - Redux will not be updated');
      }

    } catch (error) {
      console.error('❌ UPDATE NOTE FAILED:', error);
      throw error;
    }
  },

  /**
   * Get shared users for a note
   */
  getSharedUsers: (note: Note): string[] => {
    try {
      return note.shared_with || [];
    } catch (error) {
      console.error('Error getting shared users:', error);
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