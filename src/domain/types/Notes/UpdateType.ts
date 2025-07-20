export interface UpdateNoteRequest {
  title: string;
  details: string;
}

export interface UpdateNoteResponse {
  message: string;
  note: {
    id: string;
    title: string;
    details: string;
    owner_id: string;
    shared_with: string[];
    bookmarked_by: string[];
    created_at: string;
    updated_at: string;
  };
}
