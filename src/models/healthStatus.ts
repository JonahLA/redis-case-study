export interface HealthStatus {
  status: string;
  timestamp: string;
  message: string;
  services?: {
    database?: {
      status: string;
      message: string;
    },
    redis?: {
      status: string;
      message: string;
    }
  };
}
