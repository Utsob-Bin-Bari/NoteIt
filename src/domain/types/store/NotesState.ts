export interface Note {
  local_id: string;                     // Primary identifier - always present, used for all local operations
  server_id?: string | null;            // Server identifier - only present after sync, used for server operations
  title: string;
  details: string;
  owner_id: string;
  shared_with: string[]; 
  bookmarked_by: string[]; 
  created_at: string;
  updated_at: string;
}

export interface NotesState {
  data: Note[];
  selectedNoteId: string | null;        // Should always store local_id for consistency
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