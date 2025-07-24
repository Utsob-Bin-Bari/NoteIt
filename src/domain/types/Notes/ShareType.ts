export interface ShareNoteRequest {
    email: string;
  }

export interface ShareNoteRequestForQuery extends ShareNoteRequest {
    local_id?: string; // Add local_id for server mapping
  }
  
export interface ShareNoteResponse {
message: string;
note: {
    _id: string;//both are same server id
    id: string;//both are same server id
    title: string;
    details: string;
    owner_id: string;
    shared_with: string[];
    bookmarked_by: string[];
    created_at: string;
    updated_at: string;
};
}