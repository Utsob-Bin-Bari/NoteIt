export const SetSelectedNoteId = "SetSelectedNoteId" as const;

export const setSelectedNoteId = (noteId: string) => ({
  type: SetSelectedNoteId,
  payload: noteId,
} as const);

export type SetSelectedNoteIdAction = ReturnType<typeof setSelectedNoteId>; 