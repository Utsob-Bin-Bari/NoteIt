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
  loading: false,
  refreshing: false,
  syncing: false,
  syncStatus: {
    pendingOperations: 0,
    failedOperations: 0,
    lastSyncAt: null,
  },
  error: null,
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
  data: [],
  loading: false,
  refreshing: false,
  syncing: false,
  syncStatus: {
    pendingOperations: 0,
    failedOperations: 0,
    lastSyncAt: null,
  },
  error: null,
};

// Root initial state
export const rootInitialState: RootState = {
  notes: notesInitialState,
  auth: authInitialState,
  bookmarks: bookmarksInitialState,
}; 