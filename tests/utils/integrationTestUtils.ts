/**
 * Integration Test Utilities
 * 
 * This file contains helper functions and patterns for integration testing
 * that spans multiple components.
 */
import { createServiceTestDependencies } from './serviceTestUtils';
import { testData } from './mockUtils';

/**
 * Creates a test environment for integration testing
 * @param customMocks - Optional custom mock implementations
 * @returns Object containing test environment
 */
export const createIntegrationTestEnvironment = (customMocks = {}) => {
  // Get dependencies from service test utils
  const dependencies = createServiceTestDependencies(customMocks);
  
  // Return an object with test data and mock dependencies
  return {
    ...dependencies,
    testData,
  };
};

/**
 * Sets up a test workflow that involves multiple services/controllers
 * @param services - Object of service instances to use in testing
 * @param controllers - Object of controller instances to use in testing
 * @returns Test workflow utilities
 */
export const setupTestWorkflow = (
  services: Record<string, any>,
  controllers: Record<string, any> = {}
) => {
  // Storage for workflow state
  const state: Record<string, any> = {};
  
  return {
    /**
     * Gets the current workflow state
     */
    getState: () => state,
    
    /**
     * Updates the workflow state with new values
     */
    updateState: (newValues: Record<string, any>) => {
      Object.assign(state, newValues);
      return state;
    },
    
    /**
     * Gets a service instance
     */
    getService: (name: string) => services[name],
    
    /**
     * Gets a controller instance
     */
    getController: (name: string) => controllers[name],
    
    /**
     * Cleanup resources after workflow test
     */
    cleanup: async () => {
      // Clean up services
      for (const serviceName in services) {
        const service = services[serviceName];
        if (service && typeof service.cleanup === 'function') {
          await service.cleanup();
        }
      }
    },
  };
};

/**
 * Helper to run an integration test sequence
 * @param testSteps - Array of test step functions to execute in order
 * @returns Promise that resolves when all steps complete
 */
export const runIntegrationSequence = async (
  testSteps: Array<() => Promise<any>>
): Promise<void> => {
  for (const step of testSteps) {
    await step();
  }
};