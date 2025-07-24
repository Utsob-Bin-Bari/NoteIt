export interface DeleteNoteRequest {
  // No request body needed for delete operation
}

export interface DeleteNoteRequestForQuery extends DeleteNoteRequest {
  local_id?: string; 
}

export interface DeleteNoteResponse {
  message: string;
}
