// Import diff-match-patch with any type due to lack of TypeScript definitions
const DiffMatchPatch = require('diff-match-patch');
import { Note } from '../../../domain/types/store/NotesState';
import { fetchNoteById } from '../../../infrastructure/api/requests/notes/fetchNoteById';
import { NetworkService } from '../../../infrastructure/utils/NetworkService';

/**
 * Conflict resolution service for note updates
 * Implements "last write wins" strategy using diff-match-patch
 */
export const conflictResolutionService = {
  /**
   * Check if conflict resolution is needed for a note update
   * Only applies when:
   * - Internet connection is available
   * - Note has server_id (not local-only)
   * - Note exists on server
   */
  shouldCheckForConflicts: async (noteId: string, accessToken?: string): Promise<boolean> => {
    try {
      // Check internet connectivity
      const isOnline = await NetworkService.checkInternetReachability();
      if (!isOnline) {
        return false;
      }

      // Check if we have access token
      if (!accessToken) {
        return false;
      }

      // Check if note has server ID (not a local-only note)
      if (noteId.startsWith('local_')) {
        return false;
      }

      return true;
    } catch (error) {
      console.log('Error checking conflict resolution conditions:', error);
      return false;
    }
  },

  /**
   * Fetch current server version of the note
   */
    fetchServerNote: async (noteId: string, accessToken: string): Promise<Note | null> => {
    try {
      const response = await fetchNoteById({ noteId, accessToken });
      if (response.note) {
        return {
          local_id: `server_${response.note.id}`, // Temporary local_id for server note
          server_id: response.note.id,
          title: response.note.title || '',
          details: response.note.details || '',
          owner_id: response.note.owner_id,
          shared_with: response.note.shared_with || [],
          bookmarked_by: response.note.bookmarked_by || [],
          created_at: response.note.created_at,
          updated_at: response.note.updated_at,
        };
      }
      return null;
    } catch (error) {
      console.log('Error fetching server note:', error);
      return null;
    }
  },

  /**
   * Resolve conflicts between local and server versions using diff-match-patch
   * Implements "last write wins" strategy for similar writes
   * 
   * @param localNote Current local note data
   * @param serverNote Current server note data
   * @param originalNote Original note data before local changes (for 3-way merge)
   * @returns Merged note data
   */
  resolveConflicts: (
    localNote: { title: string; details: string },
    serverNote: Note,
    originalNote?: { title: string; details: string }
  ): { title: string; details: string; hasConflicts: boolean; conflictDetails: string[] } => {
    const dmp = new DiffMatchPatch();
    const conflictDetails: string[] = [];
    let hasConflicts = false;

    // Resolve title conflicts
    let resolvedTitle = localNote.title;
    if (localNote.title !== serverNote.title) {
      if (originalNote && originalNote.title !== serverNote.title && originalNote.title !== localNote.title) {
        // Both local and server changed title - merge using diff-match-patch
                 const patches = dmp.patch_make(originalNote.title, localNote.title);
         const mergeResult = dmp.patch_apply(patches, serverNote.title);
         resolvedTitle = mergeResult[0];
         
         // Check if merge was successful
         const hasFailedPatches = mergeResult[1].some((success: boolean) => !success);
         if (hasFailedPatches) {
           // Last write wins - use local version
           resolvedTitle = localNote.title;
          conflictDetails.push('Title conflict resolved using local version (last write wins)');
          hasConflicts = true;
        } else {
          conflictDetails.push('Title merged successfully');
        }
      } else if (originalNote && originalNote.title === serverNote.title) {
        // Only local changed title - use local version
        resolvedTitle = localNote.title;
      } else if (originalNote && originalNote.title === localNote.title) {
        // Only server changed title - use server version
        resolvedTitle = serverNote.title;
        conflictDetails.push('Title updated from server');
      } else {
        // No original version or both changed - last write wins (local)
        resolvedTitle = localNote.title;
        conflictDetails.push('Title conflict resolved using local version (last write wins)');
        hasConflicts = true;
      }
    }

    // Resolve details conflicts
    let resolvedDetails = localNote.details;
    if (localNote.details !== serverNote.details) {
      if (originalNote && originalNote.details !== serverNote.details && originalNote.details !== localNote.details) {
        // Both local and server changed details - merge using diff-match-patch
                 const patches = dmp.patch_make(originalNote.details, localNote.details);
         const mergeResult = dmp.patch_apply(patches, serverNote.details);
         resolvedDetails = mergeResult[0];
         
         // Check if merge was successful
         const hasFailedPatches = mergeResult[1].some((success: boolean) => !success);
         if (hasFailedPatches) {
           // Last write wins - use local version
           resolvedDetails = localNote.details;
          conflictDetails.push('Content conflict resolved using local version (last write wins)');
          hasConflicts = true;
        } else {
          conflictDetails.push('Content merged successfully');
        }
      } else if (originalNote && originalNote.details === serverNote.details) {
        // Only local changed details - use local version
        resolvedDetails = localNote.details;
      } else if (originalNote && originalNote.details === localNote.details) {
        // Only server changed details - use server version
        resolvedDetails = serverNote.details;
        conflictDetails.push('Content updated from server');
      } else {
        // No original version or both changed - last write wins (local)
        resolvedDetails = localNote.details;
        conflictDetails.push('Content conflict resolved using local version (last write wins)');
        hasConflicts = true;
      }
    }

    return {
      title: resolvedTitle,
      details: resolvedDetails,
      hasConflicts,
      conflictDetails
    };
  },

  /**
   * Perform complete conflict resolution for a note update
   * 
   * @param noteId Note ID to check for conflicts
   * @param localChanges Local changes to apply
   * @param originalNote Original note data before changes (for 3-way merge)
   * @param accessToken Access token for server requests
   * @returns Resolved note data or null if no conflicts
   */
  performConflictResolution: async (
    noteId: string,
    localChanges: { title: string; details: string },
    originalNote: { title: string; details: string },
    accessToken: string
  ): Promise<{
    needsResolution: boolean;
    resolvedData?: { title: string; details: string };
    conflictInfo?: { hasConflicts: boolean; conflictDetails: string[] };
    error?: string;
  }> => {
    try {
      // Check if conflict resolution is needed
      const shouldCheck = await conflictResolutionService.shouldCheckForConflicts(noteId, accessToken);
      if (!shouldCheck) {
        return { needsResolution: false };
      }

      // Fetch current server version
      const serverNote = await conflictResolutionService.fetchServerNote(noteId, accessToken);
      if (!serverNote) {
        // Server note not found, proceed with local changes
        return { needsResolution: false };
      }

      // Check if there are any differences between local and server
      const hasServerChanges = 
        localChanges.title !== serverNote.title || 
        localChanges.details !== serverNote.details;

      if (!hasServerChanges) {
        // No conflicts, proceed with local changes
        return { needsResolution: false };
      }

      // Resolve conflicts
      const resolution = conflictResolutionService.resolveConflicts(
        localChanges,
        serverNote,
        originalNote
      );

      return {
        needsResolution: true,
        resolvedData: {
          title: resolution.title,
          details: resolution.details
        },
        conflictInfo: {
          hasConflicts: resolution.hasConflicts,
          conflictDetails: resolution.conflictDetails
        }
      };

    } catch (error) {
      console.log('Error performing conflict resolution:', error);
      return {
        needsResolution: false,
        error: `Conflict resolution failed: ${error}`
      };
    }
  }
}; 