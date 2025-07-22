export const SetNotesRefreshing = 'SetNotesRefreshing' as const;

export const setNotesRefreshing = (refreshing: boolean) => ({
  type: SetNotesRefreshing,
  payload: refreshing,
} as const);

export type SetNotesRefreshingAction = ReturnType<typeof setNotesRefreshing>; 