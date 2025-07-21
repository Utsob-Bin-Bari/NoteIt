import { NotesState } from "../../../../domain/types/store";
import { SetAllNotes, SetAllNotesAction } from "../../action/notes/setAllNotes";
import { SetSelectedNoteId, SetSelectedNoteIdAction } from "../../action/notes/setSelectedNoteId";
import { DeleteSelectedNoteId, DeleteSelectedNoteIdAction } from "../../action/notes/deleteSelectedNoteId";
import { notesInitialState } from "../../initialState";

type NotesAction = SetAllNotesAction | SetSelectedNoteIdAction | DeleteSelectedNoteIdAction;

export const notesReducer = (state: NotesState = notesInitialState, action: NotesAction) => {
  switch (action.type) {
    case SetAllNotes:
      return {
        ...state,
        data: action.payload,
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
    default:
      return state;
  }
}; 