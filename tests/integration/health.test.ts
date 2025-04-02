import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';
import { disconnectRedis } from '../../src/lib/redis';

// Mock database connection check
jest.mock('../../src/lib/prisma', () => {
  return {
    __esModule: true,
    default: {},
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
    disconnectPrisma: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock Redis connection check
jest.mock('../../src/lib/redis', () => {
  return {
    __esModule: true,
    default: {
      status: 'ready',
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    },
    checkRedisConnection: jest.fn().mockResolvedValue(true),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
  };
});

let server: Server;

beforeAll(() => {
  server = app.listen(4000);
});

// Fixed TypeScript error by using a Promise-based approach
afterAll(async () => {
  await disconnectRedis();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Health Check Endpoint', () => {
  it('should return a 200 status and a success message', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'Server is healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.services).toHaveProperty('database.status', 'ok');
    expect(response.body.services).toHaveProperty('redis.status', 'ok');
  });
});
