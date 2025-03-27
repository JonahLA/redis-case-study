import { PrismaClient } from '@prisma/client';

// Create global variable for PrismaClient to handle hot-reloading in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Save PrismaClient in global variable to prevent multiple instances in development
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;

// Graceful shutdown helper
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}
