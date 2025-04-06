import { HealthService } from '../../../src/services/healthService';
import * as prismaLib from '../../../src/lib/prisma';
import * as redisLib from '../../../src/lib/redis';
import { createServiceTestDependencies } from '../../utils/serviceTestUtils';

describe('HealthService', () => {
  // Create an instance of the service
  const healthService = new HealthService();
  
  // Set up mock for external dependencies
  jest.spyOn(prismaLib, 'checkDatabaseConnection');
  jest.spyOn(redisLib, 'checkRedisConnection');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the date for consistent testing
    jest.useFakeTimers().setSystemTime(new Date('2025-04-06T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('getHealthStatus', () => {
    it('should return healthy status when all services are connected', async () => {
      // Arrange
      (prismaLib.checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisLib.checkRedisConnection as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await healthService.getHealthStatus();
      
      // Assert
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2025-04-06T12:00:00.000Z',
        message: 'Server is healthy',
        services: {
          database: {
            status: 'ok',
            message: 'Connected'
          },
          redis: {
            status: 'ok',
            message: 'Connected'
          }
        }
      });
      
      expect(prismaLib.checkDatabaseConnection).toHaveBeenCalledTimes(1);
      expect(redisLib.checkRedisConnection).toHaveBeenCalledTimes(1);
    });
    
    it('should return error status when database is disconnected', async () => {
      // Arrange
      (prismaLib.checkDatabaseConnection as jest.Mock).mockResolvedValue(false);
      (redisLib.checkRedisConnection as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await healthService.getHealthStatus();
      
      // Assert
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-04-06T12:00:00.000Z',
        message: 'Service connection failed',
        services: {
          database: {
            status: 'error',
            message: 'Disconnected'
          },
          redis: {
            status: 'ok',
            message: 'Connected'
          }
        }
      });
    });
    
    it('should return error status when redis is disconnected', async () => {
      // Arrange
      (prismaLib.checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisLib.checkRedisConnection as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await healthService.getHealthStatus();
      
      // Assert
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-04-06T12:00:00.000Z',
        message: 'Service connection failed',
        services: {
          database: {
            status: 'ok',
            message: 'Connected'
          },
          redis: {
            status: 'error',
            message: 'Disconnected'
          }
        }
      });
    });
    
    it('should return error status when both services are disconnected', async () => {
      // Arrange
      (prismaLib.checkDatabaseConnection as jest.Mock).mockResolvedValue(false);
      (redisLib.checkRedisConnection as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await healthService.getHealthStatus();
      
      // Assert
      expect(result).toEqual({
        status: 'error',
        timestamp: '2025-04-06T12:00:00.000Z',
        message: 'Service connection failed',
        services: {
          database: {
            status: 'error',
            message: 'Disconnected'
          },
          redis: {
            status: 'error',
            message: 'Disconnected'
          }
        }
      });
    });
  });
});