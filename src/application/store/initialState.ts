import {  
  NotesState, 
  AuthState,
  BookmarksState, 
  RootState 
} from '../../domain/types/store';


// Notes initial state
export const notesInitialState: NotesState = {
  data: [],
  selectedNoteId: "",
};

// Users initial state
export const authInitialState: AuthState = {
  id: "",
  email: "",
  name: "",
  accessToken: "",
};

// Bookmarks initial state
export const bookmarksInitialState: BookmarksState = {
  bookmarkedNotes: [],
};

// Root initial state
export const rootInitialState: RootState = {
  notes: notesInitialState,
  auth: authInitialState,
  bookmarks: bookmarksInitialState,
}; 