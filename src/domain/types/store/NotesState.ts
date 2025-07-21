export interface Note {
  id: string;
  local_id: string; 
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
} 