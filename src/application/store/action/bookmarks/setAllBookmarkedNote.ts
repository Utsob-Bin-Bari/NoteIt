export const SetAllBookmarkedNote = "SetAllBookmarkedNote" as const;

export const setAllBookmarkedNote = (bookmarkedNotes: string[]) => ({
  type: SetAllBookmarkedNote,
  payload: bookmarkedNotes,
} as const);

export type SetAllBookmarkedNoteAction = ReturnType<typeof setAllBookmarkedNote>; 