export const SetNotesError = 'SetNotesError' as const;

export const setNotesError = (error: string | null) => ({
  type: SetNotesError,
  payload: error,
} as const);

export type SetNotesErrorAction = ReturnType<typeof setNotesError>; 