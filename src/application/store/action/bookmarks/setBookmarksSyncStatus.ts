export const SetBookmarksSyncStatus = 'SetBookmarksSyncStatus' as const;

export interface BookmarksSyncStatusPayload {
  pendingOperations: number;
  failedOperations: number;
  lastSyncAt: string | null;
}

export const setBookmarksSyncStatus = (syncStatus: BookmarksSyncStatusPayload) => ({
  type: SetBookmarksSyncStatus,
  payload: syncStatus,
} as const);

export type SetBookmarksSyncStatusAction = ReturnType<typeof setBookmarksSyncStatus>; 