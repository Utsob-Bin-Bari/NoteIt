export const SetBookmarksLoading = 'SetBookmarksLoading' as const;

export const setBookmarksLoading = (loading: boolean) => ({
  type: SetBookmarksLoading,
  payload: loading,
} as const);

export type SetBookmarksLoadingAction = ReturnType<typeof setBookmarksLoading>; 