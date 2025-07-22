export const SetSyncStatus = 'SetSyncStatus' as const;

export interface SyncStatusPayload {
  pendingOperations: number;
  failedOperations: number;
  lastSyncAt: string | null;
}

export const setSyncStatus = (syncStatus: SyncStatusPayload) => ({
  type: SetSyncStatus,
  payload: syncStatus,
} as const);

export type SetSyncStatusAction = ReturnType<typeof setSyncStatus>; 