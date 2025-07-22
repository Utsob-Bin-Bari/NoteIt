import { DatabaseInit } from './DatabaseInit';

export const startSQLiteConnection = async (): Promise<boolean> => {
  try {
    const dbInit = DatabaseInit.getInstance();

    await dbInit.initializeDatabase();

    // Verify database health
    const isHealthy = await dbInit.checkDatabaseHealth();
    
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    return true;
  } catch (error) {
    return false;
  }
}; 