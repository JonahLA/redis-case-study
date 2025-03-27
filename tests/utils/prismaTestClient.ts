import { PrismaClient } from '@prisma/client';

// Create a test-specific Prisma client
const prismaTestClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('redis_case_study', 'redis_test') || 
           'postgresql://postgres:postgres@localhost:5432/redis_test'
    },
  },
});

// Helper to clean the test database
export async function cleanDatabase() {
  await prismaTestClient.product.deleteMany({});
  await prismaTestClient.category.deleteMany({});
  await prismaTestClient.brand.deleteMany({});
}

export default prismaTestClient;
