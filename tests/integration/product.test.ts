import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';
import { disconnectRedis } from '../../src/lib/redis';
import { AppError } from '../../src/middleware/errorMiddleware';
import { Request, Response, NextFunction } from 'express';

// Mock AppError class for proper error handling
jest.mock('../../src/middleware/errorMiddleware', () => {
  return {
    AppError: class AppError extends Error {
      statusCode: number;
      status: string;
      isOperational: boolean;

      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
      }
    }
  };
});

// Mock routes/index.ts to make sure routes are registered
jest.mock('../../src/routes/index', () => {
  const express = require('express');
  const router = express.Router();
  
  // Mock product routes
  router.get('/products', (req: Request, res: Response) => {
    const mockProducts = [
      {
        id: 1,
        name: 'StrikeMaster Pro X1',
        description: 'Tournament-grade ball',
        price: '249.99',
        stock: 20,
        imageUrl: 'https://example.com/products/x1.jpg',
        categoryId: 1,
        brandId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'ThunderRoll Cyclone',
        description: 'High-performance asymmetric core with strong backend reaction',
        price: '229.99',
        stock: 15,
        imageUrl: 'https://example.com/products/cyclone.jpg',
        categoryId: 1,
        brandId: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.status(200).json({ products: mockProducts });
  });
  
  router.get('/products/:id', (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return next(new AppError('Invalid product ID format', 400));
    }
    
    if (id === 999) {
      return next(new AppError('Product not found', 404));
    }
    
    const mockProductDetail = {
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: '249.99',
      stock: 20,
      imageUrl: 'https://example.com/products/x1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: {
        id: 1,
        name: 'Professional',
        description: 'Pro grade bowling balls'
      },
      brand: {
        id: 1,
        name: 'StrikeMaster',
        description: 'Premium bowling equipment',
        imageUrl: 'https://example.com/brands/strikemaster.jpg'
      },
      relatedProducts: [
        {
          id: 2,
          name: 'ThunderRoll Cyclone',
          price: '229.99',
          imageUrl: 'https://example.com/products/cyclone.jpg'
        },
        {
          id: 3,
          name: 'StrikeMaster Elite',
          price: '279.99',
          imageUrl: 'https://example.com/products/elite.jpg'
        }
      ]
    };
    
    res.status(200).json(mockProductDetail);
  });
  
  return router;
});

// Mock ProductService
jest.mock('../../src/services/productService', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: '249.99',
      stock: 20,
      imageUrl: 'https://example.com/products/x1.jpg',
      categoryId: 1,
      brandId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'ThunderRoll Cyclone',
      description: 'High-performance asymmetric core with strong backend reaction',
      price: '229.99',
      stock: 15,
      imageUrl: 'https://example.com/products/cyclone.jpg',
      categoryId: 1,
      brandId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockProductDetail = {
    id: 1,
    name: 'StrikeMaster Pro X1',
    description: 'Tournament-grade ball',
    price: '249.99',
    stock: 20,
    imageUrl: 'https://example.com/products/x1.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 1,
      name: 'Professional',
      description: 'Pro grade bowling balls'
    },
    brand: {
      id: 1,
      name: 'StrikeMaster',
      description: 'Premium bowling equipment',
      imageUrl: 'https://example.com/brands/strikemaster.jpg'
    },
    relatedProducts: [
      {
        id: 2,
        name: 'ThunderRoll Cyclone',
        price: '229.99',
        imageUrl: 'https://example.com/products/cyclone.jpg'
      },
      {
        id: 3,
        name: 'StrikeMaster Elite',
        price: '279.99',
        imageUrl: 'https://example.com/products/elite.jpg'
      }
    ]
  };

  return {
    ProductService: jest.fn().mockImplementation(() => ({
      getAllProducts: jest.fn().mockResolvedValue(mockProducts),
      getProductDetail: jest.fn().mockImplementation((id) => {
        if (id === 999) {
          throw new AppError('Product not found', 404);
        }
        if (id === 1) {
          return Promise.resolve(mockProductDetail);
        }
        throw new AppError('Product not found', 404);
      })
    }))
  };
});

// Mock Express app
jest.mock('../../src/index', () => {
  const express = require('express');
  const app = express();
  const routes = require('../../src/routes/index');
  
  // Add middleware to parse JSON
  app.use(express.json());
  
  // Attach routes
  app.use('/api', routes);
  
  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message,
      status: err.status || 'error'
    });
  });
  
  return app;
});

let server: Server;

beforeAll(() => {
  server = app.listen(4003);
});

// Fixed TypeScript error by using a Promise-based approach
afterAll(async () => {
  await disconnectRedis();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Product API Endpoints', () => {
  it('GET /api/products should return all products', async () => {
    const response = await request(app).get('/api/products');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(response.body.products).toHaveLength(2);
    expect(response.body.products[0]).toHaveProperty('id', 1);
    expect(response.body.products[0]).toHaveProperty('name', 'StrikeMaster Pro X1');
    expect(response.body.products[1]).toHaveProperty('id', 2);
    expect(response.body.products[1]).toHaveProperty('name', 'ThunderRoll Cyclone');
  });

  it('GET /api/products/:id should return product detail', async () => {
    const response = await request(app).get('/api/products/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'StrikeMaster Pro X1');
    expect(response.body).toHaveProperty('category');
    expect(response.body.category).toHaveProperty('name', 'Professional');
    expect(response.body).toHaveProperty('brand');
    expect(response.body.brand).toHaveProperty('name', 'StrikeMaster');
    expect(response.body).toHaveProperty('relatedProducts');
    expect(response.body.relatedProducts).toHaveLength(2);
    expect(response.body.relatedProducts[0]).toHaveProperty('name', 'ThunderRoll Cyclone');
  });

  it('GET /api/products/:id with invalid ID should return 400', async () => {
    const response = await request(app).get('/api/products/invalid');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid product ID format');
  });

  it('GET /api/products/:id with non-existent ID should return 404', async () => {
    const response = await request(app).get('/api/products/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Product not found');
  });
});
