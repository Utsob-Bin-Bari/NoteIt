import SQLite from 'react-native-sqlite-storage';
import { DATABASE_SCHEMA, DatabaseHelpers } from './DatabaseSchema';

// Enable promise for modern async/await usage
SQLite.enablePromise(true);

export class DatabaseInit {
  private static instance: DatabaseInit;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  public static getInstance(): DatabaseInit {
    if (!DatabaseInit.instance) {
      DatabaseInit.instance = new DatabaseInit();
    }
    return DatabaseInit.instance;
  }

  /**
   * Initialize the database with all tables and indexes
   */
  public async initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
    try {
      // Open database
      this.db = await SQLite.openDatabase({
        name: 'noteit.db',
        location: 'default',
      });

      // Create all tables
      await this.createTables();
      
      // Create all indexes
      await this.createIndexes();

      // Set initial app settings
      await this.setInitialSettings();
      return this.db;

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the current database instance
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return this.db;
  }

  /**
   * Create all database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const createTableSQL of DATABASE_SCHEMA.CREATE_TABLES) {
      await this.db.executeSql(createTableSQL);
    }
  }

  /**
   * Create all database indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const createIndexSQL of DATABASE_SCHEMA.CREATE_INDEXES) {
      await this.db.executeSql(createIndexSQL);
    }
  }

  /**
   * Set initial app settings
   */
  private async setInitialSettings(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const currentTimestamp = DatabaseHelpers.getCurrentTimestamp();
    
    const initialSettings = [
      ['app_version', '1.0.0'],
      ['database_version', DATABASE_SCHEMA.VERSION.toString()],
      ['last_full_sync', ''],
      ['sync_enabled', 'true'],
      ['offline_mode', 'false']
    ];

    for (const [key, value] of initialSettings) {
      await this.db.executeSql(
        `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        [key, value, currentTimestamp]
      );
    }
  }

  /**
   * Clear all data (useful for logout)
   */
  public async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const clearTables = [
      'DELETE FROM user_session',
      'DELETE FROM notes',
      'DELETE FROM users',
      'DELETE FROM sync_queue',
      'DELETE FROM app_settings WHERE key NOT IN ("app_version", "database_version")'
    ];

    for (const clearSQL of clearTables) {
      await this.db.executeSql(clearSQL);
    }
  }

  /**
   * Close database connection
   */
  public async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  /**
   * Check database health and integrity
   */
  public async checkDatabaseHealth(): Promise<boolean> {
    try {
      if (!this.db) return false;

      // Test a simple query on each table
      await this.db.executeSql('SELECT COUNT(*) FROM user_session');
      await this.db.executeSql('SELECT COUNT(*) FROM notes');
      await this.db.executeSql('SELECT COUNT(*) FROM users');
      await this.db.executeSql('SELECT COUNT(*) FROM sync_queue');
      await this.db.executeSql('SELECT COUNT(*) FROM app_settings');

      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStats(): Promise<{
    notesCount: number;
    usersCount: number;
    pendingSyncCount: number;
    lastSyncTime: string | null;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [notesResult] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM notes'
    );
    const [usersResult] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM users'
    );
    const [syncResult] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"'
    );
    const [lastSyncResult] = await this.db.executeSql(
      'SELECT value FROM app_settings WHERE key = "last_full_sync"'
    );

    return {
      notesCount: notesResult.rows.item(0).count,
      usersCount: usersResult.rows.item(0).count,
      pendingSyncCount: syncResult.rows.item(0).count,
      lastSyncTime: lastSyncResult.rows.length > 0 ? lastSyncResult.rows.item(0).value : null
    };
  }
} 