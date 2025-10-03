import db from '@/prisma/client';

/**
 * Database connection utility with retry logic and connection pool management
 */
export class DatabaseUtils {
  private static retryAttempts = 3;
  private static retryDelay = 1000; // 1 second

  /**
   * Execute a database operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Database operation',
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`❌ ${operationName} attempt ${attempt} failed:`, error.message);
        
        // Check if it's a connection pool error
        if (this.isConnectionPoolError(error)) {
          if (attempt < maxRetries) {
            const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
        }
        
        // For non-retryable errors or max retries reached, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is related to connection pool
   */
  private static isConnectionPoolError(error: any): boolean {
    const connectionPoolErrors = [
      'P2024', // Connection pool timeout
      'connection pool',
      'connection limit',
      'pool timeout',
      'acquire timeout',
      'Timed out fetching a new connection'
    ];
    
    return connectionPoolErrors.some(errorType => 
      error.code === errorType || 
      error.message?.toLowerCase().includes(errorType.toLowerCase())
    );
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check database connection health
   */
  static async checkConnectionHealth(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection pool status (if available)
   */
  static async getConnectionPoolStatus(): Promise<any> {
    try {
      // This is a basic implementation - actual pool status depends on the database driver
      const result = await db.$queryRaw`
        SELECT 
          VARIABLE_NAME,
          VARIABLE_VALUE 
        FROM INFORMATION_SCHEMA.GLOBAL_STATUS 
        WHERE VARIABLE_NAME IN (
          'Threads_connected',
          'Threads_running',
          'Max_used_connections',
          'Max_connections'
        )
      `;
      return result;
    } catch (error) {
      console.error('❌ Failed to get connection pool status:', error);
      return null;
    }
  }

  /**
   * Gracefully close database connection
   */
  static async closeConnection(): Promise<void> {
    try {
      await db.$disconnect();
      console.log('✅ Database connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }
}

export default DatabaseUtils;
