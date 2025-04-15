import { HealthStatus } from '../types/health';
import { checkDatabaseConnection } from '../lib/prisma';
import { checkRedisConnection } from '../lib/redis';

export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    // Check database connection
    const isDatabaseConnected = await checkDatabaseConnection();
    // Check redis connection
    const isRedisConnected = await checkRedisConnection();

    // Determine overall status
    const isHealthy = isDatabaseConnected && isRedisConnected;

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      message: isHealthy ? 'Server is healthy' : 'Service connection failed',
      services: {
        database: {
          status: isDatabaseConnected ? 'ok' : 'error',
          message: isDatabaseConnected ? 'Connected' : 'Disconnected'
        },
        redis: {
          status: isRedisConnected ? 'ok' : 'error',
          message: isRedisConnected ? 'Connected' : 'Disconnected'
        }
      }
    };
  }
}
