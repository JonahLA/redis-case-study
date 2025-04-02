import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';
import { disconnectRedis } from '../../src/lib/redis';

// Mock BrandService
jest.mock('../../src/services/brandService', () => {
  const mockBrands = [
    { id: 1, name: 'StrikeMaster', description: 'Premium bowling equipment', imageUrl: 'https://example.com/brands/strikemaster.jpg' },
    { id: 2, name: 'ThunderRoll', description: 'Innovative bowling technology', imageUrl: 'https://example.com/brands/thunderroll.jpg' },
    { id: 3, name: 'PinCrusher', description: 'Reliable bowling gear', imageUrl: 'https://example.com/brands/pincrusher.jpg' }
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
      id: 4,
      name: 'StrikeMaster Advance',
      description: 'All-purpose ball',
      price: '179.99',
      stock: 25,
      imageUrl: 'https://example.com/advance.jpg',
      categoryId: 2,
      brandId: 1
    }
  ];

  return {
    BrandService: jest.fn().mockImplementation(() => ({
      getAllBrands: jest.fn().mockResolvedValue(mockBrands),
      getBrandById: jest.fn().mockImplementation((id) => {
        const brand = mockBrands.find(b => b.id === id);
        if (!brand) {
          return Promise.reject(new Error('Brand not found'));
        }
        return Promise.resolve(brand);
      }),
      getProductsByBrand: jest.fn().mockImplementation((brandId, options) => {
        if (brandId === 999) {
          return Promise.reject(new Error('Brand not found'));
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
  server = app.listen(4002);
});

// Fixed TypeScript error by using a Promise-based approach
afterAll(async () => {
  await disconnectRedis();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Brand API Endpoints', () => {
  it('GET /api/brands should return all brands', async () => {
    const response = await request(app).get('/api/brands');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('brands');
    expect(response.body.brands).toHaveLength(3);
    expect(response.body.brands[0]).toHaveProperty('id');
    expect(response.body.brands[0]).toHaveProperty('name');
    expect(response.body.brands[0]).toHaveProperty('description');
    expect(response.body.brands[0]).toHaveProperty('imageUrl');
  });

  it('GET /api/brands/:brandId should return a brand by ID', async () => {
    const response = await request(app).get('/api/brands/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('brand');
    expect(response.body.brand).toHaveProperty('id', 1);
    expect(response.body.brand).toHaveProperty('name', 'StrikeMaster');
  });

  it('GET /api/brands/:brandId/products should return products by brand', async () => {
    const response = await request(app).get('/api/brands/1/products');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.products).toHaveLength(2);
    expect(response.body.pagination).toHaveProperty('total', 2);
  });

  it('GET /api/brands/:brandId/products should handle query parameters', async () => {
    const response = await request(app)
      .get('/api/brands/1/products?limit=5&offset=0&sort=name&order=asc');
    
    expect(response.status).toBe(200);
    expect(response.body.pagination).toHaveProperty('limit', 5);
    expect(response.body.pagination).toHaveProperty('offset', 0);
  });

  it('GET /api/brands/:brandId with invalid ID should return 400', async () => {
    const response = await request(app).get('/api/brands/invalid');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid brand ID');
  });

  it('GET /api/brands/:brandId/products with invalid parameters should return 400', async () => {
    const response = await request(app).get('/api/brands/1/products?sort=invalid');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid sort parameter');
  });
});
