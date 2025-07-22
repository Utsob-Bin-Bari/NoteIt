export const SetBookmarksRefreshing = 'SetBookmarksRefreshing' as const;

export const setBookmarksRefreshing = (refreshing: boolean) => ({
  type: SetBookmarksRefreshing,
  payload: refreshing,
} as const);

export type SetBookmarksRefreshingAction = ReturnType<typeof setBookmarksRefreshing>; 