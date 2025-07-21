import { NotesState } from './NotesState';
import { AuthState } from './AuthState';
import { BookmarksState } from './BookmarksState';

export interface RootState {
  notes: NotesState;
  auth: AuthState;
  bookmarks: BookmarksState;
} 