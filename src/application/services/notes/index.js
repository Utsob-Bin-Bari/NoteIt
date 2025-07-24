export { notesService } from './notesService';
export { noteEditorService } from './noteEditorService';
export { notesSQLiteService } from './notesSQLiteService';
export { conflictResolutionService } from './conflictResolutionService';
export { deleteNote } from './deleteNote';
export { shareNote } from './shareNote';
export { syncProcessor, startSyncProcessor, stopSyncProcessor, initializeSyncProcessor } from './syncProcessor';

const { notesSQLiteService: sqliteService } = require('./notesSQLiteService');

/**
 * Deduplicate notes by removing local duplicates that have server counterparts
 * This fixes existing duplicate issues caused by ID mismatches
 */
export const deduplicateNotes = async (userId) => {
  try {
    const allNotes = await sqliteService.fetchAllNotes(userId);
    const duplicates = {};
    
    // Group notes by title and content to find duplicates
    allNotes.forEach((note) => {
      const key = `${note.title?.trim() || ''}_${note.details?.trim() || ''}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(note);
    });
    
    let removedCount = 0;
    let keptCount = 0;
    
    // Process each group of potential duplicates
    for (const [key, notes] of Object.entries(duplicates)) {
      if (notes.length > 1) {
        // Sort by preference: synced > pending, newer > older
        notes.sort((a, b) => {
          // Prefer newer notes
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        
        // Keep the first (newest) note, remove the rest
        const keepNote = notes[0];
        const removeNotes = notes.slice(1);
        
        keptCount++;
        
        for (const removeNote of removeNotes) {
          await sqliteService.deleteNote(removeNote.id);
          removedCount++;
        }
      } else {
        keptCount++;
      }
    }
    
    return { removed: removedCount, kept: keptCount };
    
  } catch (error) {
    console.error('❌ Error during deduplication:', error);
    throw error;
  }
}; 