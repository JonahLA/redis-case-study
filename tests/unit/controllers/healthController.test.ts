import { Request, Response } from 'express';
import { HealthService } from '../../../src/services/healthService';
import healthController from '../../../src/controllers/healthController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';

// Mock the HealthService
jest.mock('../../../src/services/healthService', () => {
  const mockGetHealthStatus = jest.fn();
  
  return {
    HealthService: jest.fn().mockImplementation(() => ({
      getHealthStatus: mockGetHealthStatus
    })),
    mockGetHealthStatus // export the mock function for test access
  };
});

// Import the mock function after mocking
const { mockGetHealthStatus } = jest.requireMock('../../../src/services/healthService');

describe('Health Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the date for consistent testing
    jest.useFakeTimers().setSystemTime(new Date('2025-04-06T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('GET /', () => {
    it('should return health status with 200 OK', async () => {
      // Arrange
      const mockHealthStatus = {
        status: 'ok',
        timestamp: '2025-04-06T12:00:00.000Z',
        message: 'Server is healthy',
        services: {
          database: { status: 'ok', message: 'Connected' },
          redis: { status: 'ok', message: 'Connected' }
        }
      };
      
      // Mock the health service to return our test data
      mockGetHealthStatus.mockResolvedValue(mockHealthStatus);
      
      // Create mocked Express request, response, and next function objects
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      // Get the route handler directly from the controller router
      const routeHandler = healthController.stack?.[0]?.route?.stack?.[0]?.handle;
      
      // Make sure we found the route handler
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert: Check that the handler called status and json with expected values
      expect(mockGetHealthStatus).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Get the actual argument passed to res.json
      const responseBody = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseBody).toEqual(mockHealthStatus);
    });
    
    it('should propagate errors up (to be handled by Express error middleware)', async () => {
      // Arrange
      const errorMessage = 'Failed to get health status';
      const testError = new Error(errorMessage);
      mockGetHealthStatus.mockRejectedValue(testError);
      
      // Create mock request, response, and next function
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      // Get the route handler
      const routeHandler = healthController.stack?.[0]?.route?.stack?.[0]?.handle;
      
      // Make sure we found the route handler
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act & Assert: Verify that the error is propagated (Express would catch this)
      try {
        await routeHandler(req, res, next);
        fail('Expected an error to be thrown');
      } catch (error: any) { // Fix type with explicit 'any' type annotation
        expect(error).toEqual(testError);
        expect(error.message).toBe(errorMessage);
      }
      
      // Verify no response was sent
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});