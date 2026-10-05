import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Single shared PrismaClient for the whole process.
 *
 * PrismaClient owns a connection pool internally, so the app must instantiate it
 * exactly once and import this `prisma` everywhere rather than calling
 * `new PrismaClient()` per request/module (which would exhaust DB connections).
 *
 * Prisma 7 requires a driver adapter at runtime; PrismaPg connects to the
 * Postgres database at DATABASE_URL (see .env). The CLI reads the same var via
 * prisma.config.ts.
 *
 * Remember to `await prisma.$disconnect()` on shutdown - wired into main.ts.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'warn', 'error'],
});
