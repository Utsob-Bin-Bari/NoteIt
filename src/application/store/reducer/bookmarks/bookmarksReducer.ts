import { BookmarksState } from "../../../../domain/types/store";
import { SetAllBookmarkedNote, SetAllBookmarkedNoteAction } from "../../action/bookmarks/setAllBookmarkedNote";
import { bookmarksInitialState } from "../../initialState";

type BookmarksAction = SetAllBookmarkedNoteAction;

export const bookmarksReducer = (state: BookmarksState = bookmarksInitialState, action: BookmarksAction) => {
  switch (action.type) {
    case SetAllBookmarkedNote:
      return {
        ...state,
        bookmarkedNotes: action.payload,
      };
    default:
      return state;
  }
};