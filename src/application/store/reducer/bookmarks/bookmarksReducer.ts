import { BookmarksState } from "../../../../domain/types/store";
import { SetAllBookmarkedNote, SetAllBookmarkedNoteAction } from "../../action/bookmarks/setAllBookmarkedNote";
import { SetAllBookmarks, SetAllBookmarksAction } from "../../action/bookmarks/setAllBookmarks";
import { SetBookmarksLoading, SetBookmarksLoadingAction } from "../../action/bookmarks/setBookmarksLoading";
import { SetBookmarksRefreshing, SetBookmarksRefreshingAction } from "../../action/bookmarks/setBookmarksRefreshing";
import { SetBookmarksSyncing, SetBookmarksSyncingAction } from "../../action/bookmarks/setBookmarksSyncing";
import { SetBookmarksSyncStatus, SetBookmarksSyncStatusAction } from "../../action/bookmarks/setBookmarksSyncStatus";
import { SetBookmarksError, SetBookmarksErrorAction } from "../../action/bookmarks/setBookmarksError";
import { ClearAllBookmarks, ClearAllBookmarksAction } from "../../action/bookmarks/clearAllBookmarks";
import { bookmarksInitialState } from "../../initialState";

type BookmarksAction = 
  | SetAllBookmarkedNoteAction
  | SetAllBookmarksAction
  | SetBookmarksLoadingAction
  | SetBookmarksRefreshingAction
  | SetBookmarksSyncingAction
  | SetBookmarksSyncStatusAction
  | SetBookmarksErrorAction
  | ClearAllBookmarksAction;

export const bookmarksReducer = (state: BookmarksState = bookmarksInitialState, action: BookmarksAction) => {
  switch (action.type) {
    case SetAllBookmarkedNote:
      return {
        ...state,
        data: action.payload, // This should be updated to work with new state structure
      };
    case SetAllBookmarks:
      return {
        ...state,
        data: action.payload,
        error: null,
      };
    case SetBookmarksLoading:
      return {
        ...state,
        loading: action.payload,
      };
    case SetBookmarksRefreshing:
      return {
        ...state,
        refreshing: action.payload,
      };
    case SetBookmarksSyncing:
      return {
        ...state,
        syncing: action.payload,
      };
    case SetBookmarksSyncStatus:
      return {
        ...state,
        syncStatus: action.payload,
      };
    case SetBookmarksError:
      return {
        ...state,
        error: action.payload,
        loading: false,
        refreshing: false,
        syncing: false,
      };
    case ClearAllBookmarks:
      return {
        ...bookmarksInitialState,
      };
    default:
      return state;
  }
};