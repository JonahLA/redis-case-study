/**
 * Service Test Utilities
 * 
 * This file contains helper functions and patterns for testing services.
 */
import { createMockPrismaClient, createMockRedisClient } from './mockUtils';

/**
 * Creates common dependencies for service tests
 * @returns Object containing mocked dependencies commonly used in services
 */
export const createServiceTestDependencies = (customMocks = {}) => {
  // Create the base mocks
  const prisma = createMockPrismaClient(customMocks.prisma || {});
  const redis = createMockRedisClient();
  
  // Mock logger to avoid console output during tests
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  
  return {
    prisma,
    redis,
    logger,
  };
};

/**
 * Helper function to test error handling in services
 * @param testFn - The function to test (should throw an error)
 * @param expectedErrorMsg - Expected error message or pattern
 * @param done - Optional Jest done callback for async tests
 */
export const expectServiceError = async (
  testFn: () => Promise<any> | any,
  expectedErrorMsg: string | RegExp,
  done?: jest.DoneCallback
) => {
  try {
    await testFn();
    // If we get here, no error was thrown
    expect('No error thrown').toBe(`Expected error: ${expectedErrorMsg}`);
    done && done.fail('Expected error was not thrown');
  } catch (err) {
    // Check if error message matches expected
    if (expectedErrorMsg instanceof RegExp) {
      expect(err.message).toMatch(expectedErrorMsg);
    } else {
      expect(err.message).toContain(expectedErrorMsg);
    }
    done && done();
  }
};

/**
 * Helper to clean up services after tests
 * @param services - Object containing services with cleanup methods
 */
export const cleanupServices = async (services: Record<string, any>) => {
  for (const serviceName in services) {
    const service = services[serviceName];
    // Call cleanup methods if they exist
    if (service && typeof service.cleanup === 'function') {
      await service.cleanup();
    }
  }
};