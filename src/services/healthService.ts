import { HealthStatus } from '../models/healthStatus';

export class HealthService {
  getHealthStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is healthy'
    };
  }
}
