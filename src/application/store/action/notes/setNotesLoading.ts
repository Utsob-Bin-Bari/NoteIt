export const SetNotesLoading = 'SetNotesLoading' as const;

export const setNotesLoading = (loading: boolean) => ({
  type: SetNotesLoading,
  payload: loading,
} as const);

export type SetNotesLoadingAction = ReturnType<typeof setNotesLoading>; 