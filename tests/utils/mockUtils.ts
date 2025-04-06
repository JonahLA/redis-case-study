/**
 * Mock Utilities for Testing
 * 
 * This file contains common mocking utilities and helpers to facilitate testing
 * across services and controllers.
 */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

/**
 * Creates a mock Express request object
 * @param options - Optional parameters to include in the mock request
 * @returns A mocked Express Request object
 */
export const createMockRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  session?: any;
  user?: any;
} = {}): Request => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    session = {},
    user = null,
  } = options;

  // Create a more complete mock that satisfies Request interface
  const req = {
    body,
    params,
    query,
    headers,
    user,
    cookies: {},
    path: '/',
    hostname: 'localhost',
    protocol: 'http',
    secure: false,
    ip: '127.0.0.1',
    method: 'GET',
    originalUrl: '/',
    baseUrl: '',
    url: '/',
    
    // Required functions
    get: jest.fn((name: string) => headers[name]),
    header: jest.fn((name: string) => headers[name]),
    accepts: jest.fn(() => true),
    acceptsEncodings: jest.fn(() => ['gzip', 'deflate']),
    acceptsCharsets: jest.fn(() => ['utf-8']),
    acceptsLanguages: jest.fn(() => ['en']),
    range: jest.fn(() => undefined),
    
    // Add session if provided (not in standard Request type)
    ...(session ? { session } : {})
  } as unknown as Request;
  
  return req;
};

/**
 * Creates a mock Express response object
 * @returns A mocked Express Response object with spy functions
 */
export const createMockResponse = (): Response => {
  const res = {} as Partial<Response>;
  
  // Status function that returns the response object for chaining
  res.status = jest.fn().mockReturnValue(res);
  
  // Common response methods
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  
  // Header manipulation
  res.setHeader = jest.fn().mockReturnValue(res);
  res.getHeader = jest.fn().mockImplementation(() => '');
  res.set = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.location = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.contentType = jest.fn().mockReturnValue(res);
  res.format = jest.fn().mockReturnValue(res);
  res.attachment = jest.fn().mockReturnValue(res);
  res.append = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.locals = {};
  
  return res as Response;
};

/**
 * Creates a mock Express next function
 * @returns A mocked Express NextFunction
 */
export const createMockNext = (): NextFunction => {
  return jest.fn();
};

// Use type any for simplicity to avoid complex Prisma types
type MockModel = Record<string, jest.Mock>;

/**
 * Creates a mock Prisma client with desired test behaviors
 * @param mockImplementations - Optional overrides for specific Prisma methods
 * @returns A mocked PrismaClient instance
 */
export const createMockPrismaClient = (mockImplementations: Record<string, any> = {}): any => {
  // Create base mock structure
  const mockPrisma: Record<string, any> = {
    product: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    } as MockModel,
    category: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    } as MockModel,
    brand: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    } as MockModel,
    cart: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
    cartItem: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
    order: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
    orderItem: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
    inventory: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
    inventoryAudit: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as MockModel,
  };

  // Add transaction method
  mockPrisma.$transaction = jest.fn().mockImplementation((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrisma);
    } else {
      return Promise.all(callback);
    }
  });

  // Override with any custom implementations
  Object.entries(mockImplementations).forEach(([key, value]) => {
    // Handle nested properties like product.findMany
    const [model, method] = key.split('.');
    if (model && method && mockPrisma[model]) {
      mockPrisma[model][method] = value;
    }
  });

  return mockPrisma;
};

/**
 * Creates a mock Redis client for testing
 * @returns A mocked Redis client instance
 */
export const createMockRedisClient = (): Partial<Redis> => {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    flushall: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
  };
};

/**
 * Helper to generate test data objects
 */
export const testData = {
  /**
   * Generates a test product object
   */
  generateProduct: (overrides = {}) => ({
    id: 'product-123',
    name: 'Test Product',
    description: 'A product for testing',
    price: 9.99,
    imageUrl: 'https://example.com/image.jpg',
    categoryId: 'category-123',
    brandId: 'brand-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Generates a test category object
   */
  generateCategory: (overrides = {}) => ({
    id: 'category-123',
    name: 'Test Category',
    description: 'A category for testing',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Generates a test brand object
   */
  generateBrand: (overrides = {}) => ({
    id: 'brand-123',
    name: 'Test Brand',
    description: 'A brand for testing',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  /**
   * Generates a test cart object
   */
  generateCart: (overrides = {}) => ({
    id: 'cart-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  }),
  
  /**
   * Generates a test cart item object
   */
  generateCartItem: (overrides = {}) => ({
    id: 'cart-item-123',
    cartId: 'cart-123',
    productId: 'product-123',
    quantity: 1,
    product: testData.generateProduct(),
    ...overrides,
  }),
  
  /**
   * Generates a test order object
   */
  generateOrder: (overrides = {}) => ({
    id: 'order-123',
    userId: 'user-123',
    status: 'PENDING',
    totalAmount: 49.95,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  }),
  
  /**
   * Generates a test inventory object
   */
  generateInventory: (overrides = {}) => ({
    id: 'inventory-123',
    productId: 'product-123',
    quantity: 100,
    updatedAt: new Date(),
    ...overrides,
  }),
};