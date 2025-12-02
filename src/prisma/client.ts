import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

// Connection pool configuration
const connectionPoolConfig = {
  connectionLimit: 25, // Increased from default 9
  poolTimeout: 60000, // 60 seconds instead of 10
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000, // 60 seconds
};

// Add connection pool parameters to DATABASE_URL if not already present
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', connectionPoolConfig.connectionLimit.toString());
  url.searchParams.set('pool_timeout', connectionPoolConfig.poolTimeout.toString());
  url.searchParams.set('acquire_timeout', connectionPoolConfig.acquireTimeout.toString());
  url.searchParams.set('timeout', connectionPoolConfig.timeout.toString());
  // Add additional MySQL-specific parameters
  url.searchParams.set('max_connections', '25');
  url.searchParams.set('connect_timeout', '60');
  process.env.DATABASE_URL = url.toString();
}

// Enhanced Prisma client configuration with connection pool management
// Note: In Prisma 7, URL is read from schema.prisma env("DATABASE_URL")
// The DATABASE_URL is modified above with connection pool parameters
const db = new PrismaClient({
  log: ['error'],
  errorFormat: 'pretty',
});

// Connection retry logic
const connectWithRetry = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await db.$connect();
      console.log('✅ Database connected successfully');
      
      // Test the connection with a simple query
      await db.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database connection test successful');
      
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        throw error;
      }
      console.log(`⏳ Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

// Add connection pool monitoring (disabled to reduce log noise)
// setInterval(async () => {
//   try {
//     const result = await db.$queryRaw`SHOW STATUS LIKE 'Threads_connected'`;
//     console.log('📊 Database connection status:', result);
//   } catch (error) {
//     console.error('❌ Failed to check database connection status:', error);
//   }
// }, 30000); // Check every 30 seconds

// Initialize connection
connectWithRetry().catch(error => {
  console.error('❌ Failed to establish database connection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔄 Closing database connection...');
  await db.$disconnect();
  console.log('✅ Database connection closed');
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connection...');
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connection...');
  await db.$disconnect();
  process.exit(0);
});

export default db;
