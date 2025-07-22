import { Note } from './NotesState';

export interface BookmarksState {
  data: Note[];
  loading: boolean;
  refreshing: boolean;
  syncing: boolean;
  syncStatus: {
    pendingOperations: number;
    failedOperations: number;
    lastSyncAt: string | null;
  };
  error: string | null;
} 