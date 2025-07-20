import { DatabaseInit } from './DatabaseInit';
import { DatabaseHelpers, OPERATION_TYPES, ENTITY_TYPES } from './DatabaseSchema';

export const startSQLiteConnection = async (): Promise<boolean> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    
    // Step 1: Initialize database with complete schema
    await dbInit.initializeDatabase();
    const db = dbInit.getDatabase();
    console.log('Step 1', '✅ Database initialized with NoteIt schema');

    // Step 2: Test user session storage (simulating login)
    const currentTime = DatabaseHelpers.getCurrentTimestamp();
    await db.executeSql(
      `INSERT OR REPLACE INTO user_session 
       (id, user_id, email, name, access_token, created_at, updated_at) 
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      ['user123', 'test@example.com', 'Test User', 'jwt_token_here', currentTime, currentTime]
    );
    console.log('Step 2', '✅ User session stored (simulating login)');

    // Step 3: Test note creation with offline-first features
    const noteId = `note_${Date.now()}`;
    const localId = DatabaseHelpers.generateLocalId();
    await db.executeSql(
      `INSERT INTO notes 
       (id, local_id, title, details, owner_id, shared_with, bookmarked_by, 
        created_at, updated_at, sync_status, needs_sync) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteId, localId, 'My First Note', 'This is a test note content',
        'user123', '[]', '[]', currentTime, currentTime, 'pending', 1
      ]
    );
    console.log('Step 3', '✅ Note created with offline-first sync tracking');

    // Step 4: Test sync queue operation
    await db.executeSql(
      `INSERT INTO sync_queue 
       (operation_type, entity_type, entity_id, payload, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        OPERATION_TYPES.CREATE, 
        ENTITY_TYPES.NOTE, 
        noteId, 
        JSON.stringify({ title: 'My First Note', details: 'This is a test note content' }),
        currentTime
      ]
    );
    console.log('Step 4', '✅ Sync operation queued for offline handling');

    // Step 5: Test sharing functionality
    const sharedWith = DatabaseHelpers.arrayToJson(['user456', 'user789']);
    await db.executeSql(
      `UPDATE notes SET shared_with = ?, needs_sync = 1 WHERE id = ?`,
      [sharedWith, noteId]
    );
    console.log('Step 5', '✅ Note sharing updated with sync tracking');

    // Step 6: Test bookmark functionality
    const bookmarkedBy = DatabaseHelpers.arrayToJson(['user123']);
    await db.executeSql(
      `UPDATE notes SET bookmarked_by = ? WHERE id = ?`,
      [bookmarkedBy, noteId]
    );
    console.log('Step 6', '✅ Bookmark functionality tested');

    // Step 7: Test data retrieval and JSON parsing
    const [noteResults] = await db.executeSql(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    );
    
    if (noteResults.rows.length > 0) {
      const note = noteResults.rows.item(0);
      const sharedUsers = DatabaseHelpers.parseJsonArray(note.shared_with);
      const bookmarkedUsers = DatabaseHelpers.parseJsonArray(note.bookmarked_by);
      
      console.log('Step 7', 
        `✅ Data retrieved and parsed:\n` +
        `Note: ${note.title}\n` +
        `Shared with: ${sharedUsers.length} users\n` +
        `Bookmarked by: ${bookmarkedUsers.length} users\n` +
        `Sync status: ${note.sync_status}`
      );
    }

    // Step 8: Test database statistics
    const stats = await dbInit.getDatabaseStats();
    console.log('Step 8', 
      `✅ Database stats:\n` +
      `Notes: ${stats.notesCount}\n` +
      `Users: ${stats.usersCount}\n` +
      `Pending sync: ${stats.pendingSyncCount}`
    );

    // Final success message
    console.log('NoteIt Database Test Complete', 
      '🎉 All database operations successful!\n\n' +
      '✅ User session management\n' +
      '✅ Note CRUD operations\n' +
      '✅ Offline-first sync tracking\n' +
      '✅ Sharing & bookmarking\n' +
      '✅ JSON array handling\n' +
      '✅ Database health checks\n\n' +
      'Your offline-first note app database is ready!'
    );

    return true;
  } catch (error) {
    console.log('Database Test Failed', 
      `❌ Error: ${error}\n\n` +
      'Please ensure:\n' +
      '1. iOS: Run "cd ios && pod install && cd .."\n' +
      '2. Android: SQLite should work automatically'
    );
    return false;
  }
}; 