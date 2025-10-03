import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

// Enhanced Prisma client configuration with connection pool management
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Connection pool configuration
const connectionPoolConfig = {
  connectionLimit: 20, // Increased from default 9
  poolTimeout: 30000, // 30 seconds instead of 10
  acquireTimeout: 30000, // 30 seconds
  timeout: 30000, // 30 seconds
};

// Add connection pool parameters to DATABASE_URL if not already present
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', connectionPoolConfig.connectionLimit.toString());
  url.searchParams.set('pool_timeout', connectionPoolConfig.poolTimeout.toString());
  url.searchParams.set('acquire_timeout', connectionPoolConfig.acquireTimeout.toString());
  url.searchParams.set('timeout', connectionPoolConfig.timeout.toString());
  process.env.DATABASE_URL = url.toString();
}

// Connection retry logic
const connectWithRetry = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await db.$connect();
      console.log('✅ Database connected successfully');
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
