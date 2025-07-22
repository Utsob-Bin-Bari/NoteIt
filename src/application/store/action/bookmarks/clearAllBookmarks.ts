export const ClearAllBookmarks = "ClearAllBookmarks" as const;

export const clearAllBookmarks = () => ({
  type: ClearAllBookmarks,
} as const);

export type ClearAllBookmarksAction = ReturnType<typeof clearAllBookmarks>; 