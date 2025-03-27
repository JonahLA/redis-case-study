import { HealthStatus } from '../models/healthStatus';
import { checkDatabaseConnection } from '../lib/prisma';

export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    // Check database connection
    const isDatabaseConnected = await checkDatabaseConnection();

    return {
      status: isDatabaseConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      message: isDatabaseConnected ? 'Server is healthy' : 'Database connection failed',
      services: {
        database: {
          status: isDatabaseConnected ? 'ok' : 'error',
          message: isDatabaseConnected ? 'Connected' : 'Disconnected'
        }
      }
    };
  }
}
