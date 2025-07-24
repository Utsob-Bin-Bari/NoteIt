export interface GetAllNotesResponse {
  notes: {
    _id: string;
    id: string;
    title: string;
    details: string;
    owner_id: string;
    shared_with: string[];
    bookmarked_by: string[];
    created_at: string;
    updated_at: string;
  }[];
}

export interface GetNoteByIdResponse {
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
