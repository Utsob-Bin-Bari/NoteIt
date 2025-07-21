import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { authReducer } from "./reducer/auth/authReducer";
import { notesReducer } from "./reducer/notes/notesReducer";
import { bookmarksReducer } from "./reducer/bookmarks/bookmarksReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  notes: notesReducer,
  bookmarks: bookmarksReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});