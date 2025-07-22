export const SetBookmarksError = 'SetBookmarksError' as const;

export const setBookmarksError = (error: string | null) => ({
  type: SetBookmarksError,
  payload: error,
} as const);

export type SetBookmarksErrorAction = ReturnType<typeof setBookmarksError>; 