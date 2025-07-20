# NoteIt Database Schema Usage Guide

## Overview
This database schema is designed for **offline-first** operation with easy API synchronization. It handles all your note-taking app requirements while tracking sync status for seamless online/offline transitions.

## Database Tables

### 1. `user_session` - Current User Info
```sql
-- Stores logged-in user info and access token
-- Only one row (single user per device)
id, user_id, email, name, access_token, created_at, updated_at, last_sync_at
```

### 2. `notes` - Main Notes Table
```sql
-- Core notes with offline-first sync tracking
id, local_id, title, details, owner_id, shared_with, bookmarked_by,
created_at, updated_at, sync_status, is_deleted, local_updated_at, needs_sync
```

### 3. `users` - Other Users (for sharing)
```sql
-- Cache of other users for sharing functionality
id, email, name, created_at, updated_at, last_fetched_at
```

### 4. `sync_queue` - Pending Operations
```sql
-- Queue of operations to sync when online
id, operation_type, entity_type, entity_id, payload, created_at, retry_count, status
```

### 5. `app_settings` - App Configuration
```sql
-- App settings and sync metadata
key, value, updated_at
```

## API Operations Mapping

### 🔐 **Authentication Operations**

#### Login/Registration Response
```javascript
// API Response → Database
{
  "access_token": "jwt_token",
  "user": {"id": "user123", "email": "test@example.com", "name": "User"}
}

// Store in user_session table
INSERT OR REPLACE INTO user_session 
(id, user_id, email, name, access_token, created_at, updated_at)
VALUES (1, 'user123', 'test@example.com', 'User', 'jwt_token', NOW(), NOW())
```

#### Get Current User
```javascript
// Retrieve from local database
SELECT user_id, email, name, access_token FROM user_session WHERE id = 1
```

---

### 📝 **Note Operations**

#### 1. Create Note (Offline-First)
```javascript
// When user creates note offline
const localId = generateLocalId();
const noteData = {
  id: null,                    // Server will assign
  local_id: localId,           // Temporary local ID
  title: "My Note",
  details: "Note content",
  owner_id: currentUserId,
  sync_status: 'pending',      // Needs to be synced
  needs_sync: 1
};

// Insert note
INSERT INTO notes (...) VALUES (...)

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload, created_at)
VALUES ('create', 'note', localId, JSON.stringify(noteData), NOW())
```

#### 2. Get All Notes
```javascript
// Get user's own notes + shared notes
SELECT * FROM notes 
WHERE (owner_id = ? OR shared_with LIKE '%"' || ? || '"%') 
  AND is_deleted = 0
ORDER BY updated_at DESC
```

#### 3. Get Note by ID
```javascript
SELECT * FROM notes WHERE id = ? AND is_deleted = 0
```

#### 4. Update Note
```javascript
// Update note with sync tracking
UPDATE notes 
SET title = ?, details = ?, local_updated_at = ?, 
    sync_status = 'pending', needs_sync = 1
WHERE id = ?

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload)
VALUES ('update', 'note', noteId, JSON.stringify(changes))
```

#### 5. Delete Note (Soft Delete)
```javascript
// Soft delete with sync tracking
UPDATE notes 
SET is_deleted = 1, local_updated_at = ?, 
    sync_status = 'pending', needs_sync = 1
WHERE id = ?

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload)
VALUES ('delete', 'note', noteId, '{}')
```

#### 6. Search Notes by Title
```javascript
SELECT * FROM notes 
WHERE title LIKE '%' || ? || '%' 
  AND (owner_id = ? OR shared_with LIKE '%"' || ? || '"%')
  AND is_deleted = 0
ORDER BY updated_at DESC
```

---

### 🤝 **Sharing Operations**

#### 7. Share Note
```javascript
// Add user to shared_with array
const currentShared = JSON.parse(note.shared_with || '[]');
currentShared.push(targetUserId);

UPDATE notes 
SET shared_with = ?, local_updated_at = ?, 
    sync_status = 'pending', needs_sync = 1
WHERE id = ?

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload)
VALUES ('share', 'note', noteId, JSON.stringify({user_id: targetUserId}))
```

#### 8. Get Shared Notes
```javascript
// Notes shared WITH current user
SELECT * FROM notes 
WHERE shared_with LIKE '%"' || ? || '"%' 
  AND owner_id != ?
  AND is_deleted = 0
ORDER BY updated_at DESC
```

#### 9. Get Users Note is Shared With
```javascript
// Parse shared_with JSON array from note
SELECT u.* FROM users u
WHERE u.id IN (/* parsed user IDs from shared_with */)
```

---

### 🔖 **Bookmark Operations**

#### 10. Bookmark Note
```javascript
// Add user to bookmarked_by array
const currentBookmarks = JSON.parse(note.bookmarked_by || '[]');
currentBookmarks.push(currentUserId);

UPDATE notes 
SET bookmarked_by = ?, local_updated_at = ?, needs_sync = 1
WHERE id = ?

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload)
VALUES ('bookmark', 'note', noteId, '{}')
```

#### 11. Remove Bookmark
```javascript
// Remove user from bookmarked_by array
const currentBookmarks = JSON.parse(note.bookmarked_by || '[]');
const filteredBookmarks = currentBookmarks.filter(id => id !== currentUserId);

UPDATE notes 
SET bookmarked_by = ?, local_updated_at = ?, needs_sync = 1
WHERE id = ?

// Queue sync operation
INSERT INTO sync_queue 
(operation_type, entity_type, entity_id, payload)
VALUES ('unbookmark', 'note', noteId, '{}')
```

#### 12. Get Bookmarked Notes
```javascript
// Notes bookmarked BY current user
SELECT * FROM notes 
WHERE bookmarked_by LIKE '%"' || ? || '"%' 
  AND is_deleted = 0
ORDER BY updated_at DESC
```

---

## 🔄 **Offline-First Sync Strategy**

### Sync Flow
1. **Offline Operations** → Stored locally with `sync_status = 'pending'`
2. **When Online** → Process `sync_queue` items
3. **API Success** → Update `sync_status = 'synced'`, clear queue item
4. **API Conflict** → Mark `sync_status = 'conflict'`, require user resolution

### Sync Queue Processing
```javascript
// Get pending sync operations
SELECT * FROM sync_queue 
WHERE status = 'pending' 
ORDER BY created_at ASC

// For each operation:
// 1. Execute API call
// 2. On success: Update entity, mark queue item complete
// 3. On conflict: Mark entity as conflict, keep queue item
// 4. On failure: Increment retry_count, reschedule
```

### Conflict Resolution
```javascript
// Find conflicted notes
SELECT * FROM notes WHERE sync_status = 'conflict'

// Show user both versions:
// - Server version (from API)
// - Local version (from database)
// Let user choose resolution
```

## 🎯 **Key Benefits**

1. **Offline-First**: All operations work offline
2. **Easy Sync**: Clear sync status tracking
3. **Conflict Handling**: Built-in conflict detection
4. **Performance**: Optimized indexes for common queries
5. **Simple JSON**: Easy handling of arrays (shared_with, bookmarked_by)
6. **Single User**: Optimized for device-specific storage
7. **Extensible**: Easy to add new features

## 🚀 **Usage Examples**

```javascript
// Initialize database
const dbInit = DatabaseInit.getInstance();
await dbInit.initializeDatabase();

// Create note offline
await createNoteOffline(title, content);

// Sync when online
await processSyncQueue();

// Handle conflicts
const conflicts = await getConflictedNotes();
for (const conflict of conflicts) {
  await resolveConflict(conflict);
}
```

This schema provides a robust foundation for your offline-first note-taking application! 🎉 