export const SetBookmarksSyncing = 'SetBookmarksSyncing' as const;

export const setBookmarksSyncing = (syncing: boolean) => ({
  type: SetBookmarksSyncing,
  payload: syncing,
} as const);

export type SetBookmarksSyncingAction = ReturnType<typeof setBookmarksSyncing>; 