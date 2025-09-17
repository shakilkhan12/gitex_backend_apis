import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

const db = new PrismaClient();

export default db;
