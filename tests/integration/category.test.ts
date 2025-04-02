import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';

// Mock CategoryService
jest.mock('../../src/services/categoryService', () => {
  const mockCategories = [
    { id: 1, name: 'Professional', description: 'Pro grade bowling balls' },
    { id: 2, name: 'Intermediate', description: 'Mid-range bowling balls' },
    { id: 3, name: 'Beginner', description: 'Entry-level bowling balls' }
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: '249.99',
      stock: 20,
      imageUrl: 'https://example.com/x1.jpg',
      categoryId: 1,
      brandId: 1
    },
    {
      id: 2,
      name: 'ThunderRoll Cyclone',
      description: 'Performance ball',
      price: '229.99',
      stock: 15,
      imageUrl: 'https://example.com/cyclone.jpg',
      categoryId: 1,
      brandId: 2
    }
  ];

  return {
    CategoryService: jest.fn().mockImplementation(() => ({
      getAllCategories: jest.fn().mockResolvedValue(mockCategories),
      getCategoryById: jest.fn().mockImplementation((id) => {
        const category = mockCategories.find(c => c.id === id);
        if (!category) {
          return Promise.reject(new Error('Category not found'));
        }
        return Promise.resolve(category);
      }),
      getProductsByCategory: jest.fn().mockImplementation((categoryId, options) => {
        if (categoryId === 999) {
          return Promise.reject(new Error('Category not found'));
        }

        const limit = options.limit || 10;
        const offset = options.offset || 0;
        
        return Promise.resolve({
          data: mockProducts,
          pagination: {
            total: mockProducts.length,
            limit,
            offset,
            hasMore: offset + limit < mockProducts.length
          }
        });
      })
    }))
  };
});

let server: Server;

beforeAll(() => {
  server = app.listen(4001);
});

afterAll((done) => {
  server.close(done);
});

describe('Category API Endpoints', () => {
  it('GET /api/categories should return all categories', async () => {
    const response = await request(app).get('/api/categories');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('categories');
    expect(response.body.categories).toHaveLength(3);
    expect(response.body.categories[0]).toHaveProperty('id');
    expect(response.body.categories[0]).toHaveProperty('name');
    expect(response.body.categories[0]).toHaveProperty('description');
  });

  it('GET /api/categories/:categoryId should return a category by ID', async () => {
    const response = await request(app).get('/api/categories/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('category');
    expect(response.body.category).toHaveProperty('id', 1);
    expect(response.body.category).toHaveProperty('name', 'Professional');
  });

  it('GET /api/categories/:categoryId/products should return products by category', async () => {
    const response = await request(app).get('/api/categories/1/products');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.products).toHaveLength(2);
    expect(response.body.pagination).toHaveProperty('total', 2);
  });

  it('GET /api/categories/:categoryId/products should handle query parameters', async () => {
    const response = await request(app)
      .get('/api/categories/1/products?limit=5&offset=0&sort=price&order=desc');
    
    expect(response.status).toBe(200);
    expect(response.body.pagination).toHaveProperty('limit', 5);
    expect(response.body.pagination).toHaveProperty('offset', 0);
  });

  it('GET /api/categories/:categoryId with invalid ID should return 400', async () => {
    const response = await request(app).get('/api/categories/invalid');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid category ID');
  });

  it('GET /api/categories/:categoryId/products with invalid parameters should return 400', async () => {
    const response = await request(app).get('/api/categories/1/products?limit=-5');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid limit parameter');
  });
});
