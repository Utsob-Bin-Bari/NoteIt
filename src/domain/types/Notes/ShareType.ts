export interface ShareNoteRequest {
    email: string;
  }
  
export interface ShareNoteResponse {
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