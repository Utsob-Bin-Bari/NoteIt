import { Note } from '../types/store/NotesState';

/**
 * Validates if the current user is the owner of a note
 * This is used to prevent unauthorized deletions
 */
export const validateNoteOwnership = (
  note: Note | null, 
  currentUserId: string
): { 
  isOwner: boolean; 
  error?: string;
} => {
  // Check if note exists
  if (!note) {
    return {
      isOwner: false,
      error: 'Note not found'
    };
  }

  // Check if current user ID is valid
  if (!currentUserId?.trim()) {
    return {
      isOwner: false,
      error: 'User authentication required'
    };
  }

  // Check if user is the owner
  const isOwner = note.owner_id === currentUserId;

  if (!isOwner) {
    return {
      isOwner: false,
      error: 'Only owner can delete the note'
    };
  }

  return {
    isOwner: true
  };
};

/**
 * Validates note ownership by note ID and user ID
 * Fetches the note from available notes list to check ownership
 */
export const validateNoteOwnershipById = (
  noteId: string,
  currentUserId: string,
  availableNotes: Note[]
): { 
  isOwner: boolean; 
  error?: string;
  note?: Note;
} => {
  // Find the note by ID (supports both server ID and local ID)
  const note = availableNotes.find(n => n.id === noteId || n.local_id === noteId);

  const validation = validateNoteOwnership(note || null, currentUserId);

  return {
    ...validation,
    note
  };
}; 