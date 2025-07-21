import { DatabaseInit } from './DatabaseInit';

export const startSQLiteConnection = async (): Promise<boolean> => {
  try {
    const dbInit = DatabaseInit.getInstance();
    
    // Initialize database with complete schema
    await dbInit.initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Verify database health
    const isHealthy = await dbInit.checkDatabaseHealth();
    
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    console.log('✅ Database is ready for use');
    return true;
  } catch (error) {
    console.log('❌ Database initialization failed:', error);
    console.log('Please ensure:');
    console.log('1. iOS: Run "cd ios && pod install && cd .."');
    console.log('2. Android: SQLite should work automatically');
    return false;
  }
}; 