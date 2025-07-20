export const DATABASE_SCHEMA = {
  // Database version for migrations
  VERSION: 1,
  
  // Table creation SQL statements
  CREATE_TABLES: [
    
    // 1. User Session Table (Current logged-in user info)
    `CREATE TABLE IF NOT EXISTS user_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),  -- Only one row allowed
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      access_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_sync_at TEXT DEFAULT NULL
    )`,

    // 2. Notes Table (Main notes with sync tracking)
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,                    -- Server ID
      local_id TEXT UNIQUE DEFAULT NULL,      -- Local temp ID for new notes
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      shared_with TEXT DEFAULT '[]',          -- JSON array of user IDs
      bookmarked_by TEXT DEFAULT '[]',        -- JSON array of user IDs
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      
      -- Offline-first sync fields
      sync_status TEXT DEFAULT 'synced',      -- 'synced', 'pending', 'conflict'
      is_deleted INTEGER DEFAULT 0,          -- Soft delete flag
      local_updated_at TEXT DEFAULT NULL,    -- Local modification timestamp
      needs_sync INTEGER DEFAULT 0           -- 1 if needs to be synced
    )`,

    // 3. Users Table (Other users for sharing)
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_fetched_at TEXT DEFAULT NULL       -- When we last fetched this user info
    )`,

    // 4. Sync Queue Table (Operations pending sync)
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,          -- 'create', 'update', 'delete', 'share', 'bookmark'
      entity_type TEXT NOT NULL,             -- 'note', 'bookmark', 'share'
      entity_id TEXT NOT NULL,               -- Note ID or operation target
      payload TEXT DEFAULT NULL,             -- JSON payload for the operation
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      status TEXT DEFAULT 'pending'          -- 'pending', 'failed', 'completed'
    )`,

    // 5. App Settings Table (App configuration and sync metadata)
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ],

  // Indexes for better performance
  CREATE_INDEXES: [
    `CREATE INDEX IF NOT EXISTS idx_notes_owner_id ON notes(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_sync_status ON notes(sync_status)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_needs_sync ON notes(needs_sync)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
  ]
};

// Helper functions for working with JSON fields
export const DatabaseHelpers = {
  // Parse JSON arrays safely
  parseJsonArray: (jsonString: string | null): string[] => {
    if (!jsonString || jsonString === '[]') return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  },

  // Convert array to JSON string
  arrayToJson: (array: string[]): string => {
    return JSON.stringify(array || []);
  },

  // Generate local temp ID for new notes
  generateLocalId: (): string => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Generate current timestamp
  getCurrentTimestamp: (): string => {
    return new Date().toISOString();
  },

  // Check if a note is shared with current user
  isNoteSharedWithUser: (note: any, userId: string): boolean => {
    const sharedWith = DatabaseHelpers.parseJsonArray(note.shared_with);
    return sharedWith.includes(userId);
  },

  // Check if a note is bookmarked by current user
  isNoteBookmarkedByUser: (note: any, userId: string): boolean => {
    const bookmarkedBy = DatabaseHelpers.parseJsonArray(note.bookmarked_by);
    return bookmarkedBy.includes(userId);
  }
};

// Sync status constants
export const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict'
} as const;

// Operation types for sync queue
export const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SHARE: 'share',
  UNSHARE: 'unshare',
  BOOKMARK: 'bookmark',
  UNBOOKMARK: 'unbookmark'
} as const;

// Entity types
export const ENTITY_TYPES = {
  NOTE: 'note',
  USER: 'user',
  BOOKMARK: 'bookmark',
  SHARE: 'share'
} as const; 