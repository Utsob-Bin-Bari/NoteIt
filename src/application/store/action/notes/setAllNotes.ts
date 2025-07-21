import { Note } from "../../../../domain/types/store";

export const SetAllNotes = "SetAllNotes" as const;

export const setAllNotes = (notes: Note[]) => ({
  type: SetAllNotes,
  payload: notes,
} as const);

export type SetAllNotesAction = ReturnType<typeof setAllNotes>; 