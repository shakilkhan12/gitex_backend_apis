// src/prisma/client.ts
import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

const db = new PrismaClient();

export default db;