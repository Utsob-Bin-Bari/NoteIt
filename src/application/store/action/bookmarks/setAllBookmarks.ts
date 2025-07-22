export const SetAllBookmarks = 'SetAllBookmarks' as const;
import { Note } from '../../../../domain/types/store/NotesState';

export const setAllBookmarks = (bookmarks: Note[]) => ({
  type: SetAllBookmarks,
  payload: bookmarks,
} as const);

export type SetAllBookmarksAction = ReturnType<typeof setAllBookmarks>; 