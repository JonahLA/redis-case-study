/**
 * Health check status values
 */
export type HealthCheckStatus = 'ok' | 'error';

/**
 * Service connection status
 */
export interface ServiceStatus {
  status: HealthCheckStatus;
  message: string;
}

/**
 * Service health status map
 */
export interface ServiceHealthMap {
  database: ServiceStatus;
  redis: ServiceStatus;
}

/**
 * Application health status response
 */
export interface HealthStatus {
  status: HealthCheckStatus;
  timestamp: string;
  message: string;
  services: ServiceHealthMap;
}