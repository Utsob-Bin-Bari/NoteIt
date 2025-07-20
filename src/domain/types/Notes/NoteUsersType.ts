export interface GetSharedUsersResponse {
  users: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
  }[];
}
