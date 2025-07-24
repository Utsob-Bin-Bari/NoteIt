export interface BookmarkNoteRequest {
  // No request body needed for bookmark operation
}

export interface BookmarkNoteRequestForQuery extends BookmarkNoteRequest {
  local_id?: string; // Add local_id for server mapping
}

export interface BookmarkNoteResponse {
  message: string;
}
