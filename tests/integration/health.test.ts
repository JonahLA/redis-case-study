import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';

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

afterAll((done) => {
  server.close(done);
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
