export const SetNotesSyncing = 'SetNotesSyncing' as const;

export const setNotesSyncing = (syncing: boolean) => ({
  type: SetNotesSyncing,
  payload: syncing,
} as const);

export type SetNotesSyncingAction = ReturnType<typeof setNotesSyncing>; 