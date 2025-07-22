import { NotesState } from "../../../../domain/types/store";
import { SetAllNotes, SetAllNotesAction } from "../../action/notes/setAllNotes";
import { SetSelectedNoteId, SetSelectedNoteIdAction } from "../../action/notes/setSelectedNoteId";
import { DeleteSelectedNoteId, DeleteSelectedNoteIdAction } from "../../action/notes/deleteSelectedNoteId";
import { DeleteNote, DeleteNoteAction } from "../../action/notes/deleteNote";
import { SetNotesLoading, SetNotesLoadingAction } from "../../action/notes/setNotesLoading";
import { SetNotesRefreshing, SetNotesRefreshingAction } from "../../action/notes/setNotesRefreshing";
import { SetNotesSyncing, SetNotesSyncingAction } from "../../action/notes/setNotesSyncing";
import { SetSyncStatus, SetSyncStatusAction } from "../../action/notes/setSyncStatus";
import { SetNotesError, SetNotesErrorAction } from "../../action/notes/setNotesError";
import { ClearAllNotes, ClearAllNotesAction } from "../../action/notes/clearAllNotes";
import { notesInitialState } from "../../initialState";

type NotesAction = 
  | SetAllNotesAction 
  | SetSelectedNoteIdAction 
  | DeleteSelectedNoteIdAction
  | DeleteNoteAction
  | SetNotesLoadingAction
  | SetNotesRefreshingAction
  | SetNotesSyncingAction
  | SetSyncStatusAction
  | SetNotesErrorAction
  | ClearAllNotesAction;

export const notesReducer = (state: NotesState = notesInitialState, action: NotesAction) => {
  switch (action.type) {
    case SetAllNotes:
      return {
        ...state,
        data: action.payload,
        error: null,
      };
    case SetSelectedNoteId:
      return {
        ...state,
        selectedNoteId: action.payload,
      };
    case DeleteSelectedNoteId:
      return {
        ...state,
        selectedNoteId: null,
      };
    case DeleteNote:
      return {
        ...state,
        data: state.data.filter(note => note.id !== action.payload),
      };
    case SetNotesLoading:
      return {
        ...state,
        loading: action.payload,
      };
    case SetNotesRefreshing:
      return {
        ...state,
        refreshing: action.payload,
      };
    case SetNotesSyncing:
      return {
        ...state,
        syncing: action.payload,
      };
    case SetSyncStatus:
      return {
        ...state,
        syncStatus: action.payload,
      };
    case SetNotesError:
      return {
        ...state,
        error: action.payload,
        loading: false,
        refreshing: false,
        syncing: false,
      };
    case ClearAllNotes:
      return {
        ...notesInitialState,
        selectedNoteId: '',
      };
    default:
      return state;
  }
}; 