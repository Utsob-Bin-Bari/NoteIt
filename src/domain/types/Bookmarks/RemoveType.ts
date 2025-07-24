export interface RemoveBookmarkRequest {
  // No request body needed for remove bookmark operation
}

export interface RemoveBookmarkRequestForQuery extends RemoveBookmarkRequest {
  local_id?: string; // Add local_id for server mapping
}

export interface RemoveBookmarkResponse {
  message: string;
}
