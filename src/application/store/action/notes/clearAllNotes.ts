export const ClearAllNotes = "ClearAllNotes" as const;

export const clearAllNotes = () => ({
  type: ClearAllNotes,
} as const);

export type ClearAllNotesAction = ReturnType<typeof clearAllNotes>; 