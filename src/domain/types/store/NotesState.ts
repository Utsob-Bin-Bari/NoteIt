export interface Note {
  id: string;
  local_id?: string | null; // Make optional and allow null since server notes don't have local_id
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
  selectedNoteId: string | null;
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