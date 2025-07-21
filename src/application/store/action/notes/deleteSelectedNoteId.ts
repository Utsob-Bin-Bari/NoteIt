export const DeleteSelectedNoteId = "DeleteSelectedNoteId" as const;

export const deleteSelectedNoteId = () => ({
  type: DeleteSelectedNoteId,
} as const);

export type DeleteSelectedNoteIdAction = ReturnType<typeof deleteSelectedNoteId>; 