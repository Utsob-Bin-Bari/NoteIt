export const DeleteNote = 'DeleteNote' as const;

export const deleteNote = (noteId: string) => ({
  type: DeleteNote,
  payload: noteId,
} as const);

export type DeleteNoteAction = ReturnType<typeof deleteNote>; 