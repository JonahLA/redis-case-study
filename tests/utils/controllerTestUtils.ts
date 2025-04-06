/**
 * Controller Test Utilities
 * 
 * This file contains helper functions and patterns for testing controllers.
 */
import { Request, Response, NextFunction } from 'express';
import { createMockRequest, createMockResponse, createMockNext } from './mockUtils';
import { AppError } from '../../src/middleware/errorMiddleware';

/**
 * Creates a controller test context with mocked request, response and services
 * @param params - Test context parameters
 * @returns Object containing test context
 */
export const createControllerTestContext = (params: {
  requestParams?: {
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
    session?: any;
    user?: any;
  };
  services?: Record<string, any>;
} = {}) => {
  const { requestParams = {}, services = {} } = params;
  
  // Create mock request and response objects
  const req = createMockRequest(requestParams);
  const res = createMockResponse();
  const next = createMockNext();
  
  return {
    req,
    res,
    next,
    services,
  };
};

/**
 * Validates a successful controller response
 * @param res - The mock response object
 * @param expectedStatus - Expected HTTP status code
 * @param expectedBody - Expected response body or matcher function
 */
export const expectSuccessResponse = (
  res: Response,
  expectedStatus: number = 200,
  expectedBody?: any | ((body: any) => void)
) => {
  // Check that status was called with expected code
  expect(res.status).toHaveBeenCalledWith(expectedStatus);
  
  // Get the actual response body
  const responseBody = (res.json as jest.Mock).mock.calls[0]?.[0];
  
  if (expectedBody !== undefined) {
    if (typeof expectedBody === 'function') {
      // Use custom validation function
      expectedBody(responseBody);
    } else {
      // Direct comparison
      expect(responseBody).toEqual(expectedBody);
    }
  }
};

/**
 * Validates an error controller response
 * @param res - The mock response object
 * @param expectedStatus - Expected HTTP error status code
 * @param expectedErrorMessage - Expected error message or pattern
 */
export const expectErrorResponse = (
  res: Response,
  expectedStatus: number = 500,
  expectedErrorMessage?: string | RegExp
) => {
  // Check that status was called with expected error code
  expect(res.status).toHaveBeenCalledWith(expectedStatus);
  
  // Get the actual response body
  const responseBody = (res.json as jest.Mock).mock.calls[0]?.[0];
  
  // Check that we have an error object in the response
  expect(responseBody).toBeDefined();
  expect(responseBody.error || responseBody.message).toBeDefined();
  
  const errorMessage = responseBody.error || responseBody.message;
  
  if (expectedErrorMessage) {
    if (expectedErrorMessage instanceof RegExp) {
      expect(errorMessage).toMatch(expectedErrorMessage);
    } else {
      expect(errorMessage).toContain(expectedErrorMessage);
    }
  }
};

/**
 * Validates that an error was passed to the next middleware (for error middleware)
 * @param next - The mock next function
 * @param expectedErrorType - Expected error type
 * @param expectedMessage - Expected error message or pattern
 * @param expectedStatus - Expected status code (if using AppError)
 */
export const expectNextCalledWithError = (
  next: jest.Mock,
  expectedErrorType: any = Error,
  expectedMessage?: string | RegExp,
  expectedStatus?: number
) => {
  expect(next).toHaveBeenCalled();
  
  // Get the error passed to next
  const error = next.mock.calls[0][0];
  
  // Verify it's the expected type
  expect(error).toBeInstanceOf(expectedErrorType);
  
  // Verify message if provided
  if (expectedMessage) {
    if (expectedMessage instanceof RegExp) {
      expect(error.message).toMatch(expectedMessage);
    } else {
      expect(error.message).toContain(expectedMessage);
    }
  }
  
  // If we expected an AppError, verify the status code
  if (expectedStatus && error instanceof AppError) {
    expect(error.statusCode).toBe(expectedStatus);
  }
};

/**
 * Creates a mock instance of a controller class
 * @param ControllerClass - The controller class to mock
 * @param serviceMocks - Mocked services to inject
 * @returns Instance of the controller with mocked dependencies
 */
export const createMockController = (
  ControllerClass: any,
  serviceMocks: Record<string, any> = {}
) => {
  return new ControllerClass(serviceMocks);
};

/**
 * Execute error middleware with a captured error to test controller error handling
 * @param err - The error object
 * @param req - Mock request object
 * @param res - Mock response object
 */
export const simulateErrorMiddleware = (
  err: Error | AppError,
  req: Request = createMockRequest(),
  res: Response = createMockResponse()
) => {
  // Import and execute the error middleware
  const { errorMiddleware } = require('../../src/middleware/errorMiddleware');
  const next = createMockNext();
  
  // Execute the middleware
  errorMiddleware(err, req, res, next);
  
  // Return the mock response for assertions
  return { res, req, next };
};

/**
 * Helper to test a controller method that might throw errors caught by middleware
 * @param controllerFn - The controller function to test
 * @param req - Mock request object
 * @param res - Mock response object
 * @param next - Mock next function
 */
export const executeControllerWithErrorHandling = async (
  controllerFn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  req: Request = createMockRequest(),
  res: Response = createMockResponse(),
  next: NextFunction = createMockNext()
) => {
  try {
    await controllerFn(req, res, next);
    return { req, res, next, error: null };
  } catch (error) {
    return { req, res, next, error };
  }
};