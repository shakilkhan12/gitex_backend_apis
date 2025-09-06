// src/prisma/client.ts
import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

// Load environment variables from default .env
dotenv.config();

// If running in production and DATABASE_URL_PROD exists, override DATABASE_URL
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

const db = new PrismaClient();

export default db;
