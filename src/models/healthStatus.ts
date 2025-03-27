export interface HealthStatus {
  status: string;
  timestamp: string;
  message: string;
  services?: {
    database?: {
      status: string;
      message: string;
    }
  };
}
