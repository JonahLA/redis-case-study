import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Documentation',
      version: '1.0.0',
      description: 'API documentation for the e-commerce platform with Redis caching',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:7090',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The unique identifier for the product'
            },
            name: {
              type: 'string',
              description: 'The name of the product'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the product'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'The price of the product'
            },
            stock: {
              type: 'integer',
              description: 'Current stock level'
            },
            imageUrl: {
              type: 'string',
              nullable: true,
              description: 'URL to the product image'
            },
            categoryId: {
              type: 'integer',
              description: 'ID of the category this product belongs to'
            },
            brandId: {
              type: 'integer',
              description: 'ID of the brand this product belongs to'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'name', 'description', 'price', 'stock', 'categoryId', 'brandId']
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The unique identifier for the category'
            },
            name: {
              type: 'string',
              description: 'The name of the category'
            },
            description: {
              type: 'string',
              description: 'Description of the category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'name', 'description']
        },
        Brand: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The unique identifier for the brand'
            },
            name: {
              type: 'string',
              description: 'The name of the brand'
            },
            description: {
              type: 'string',
              description: 'Description of the brand'
            },
            imageUrl: {
              type: 'string',
              nullable: true,
              description: 'URL to the brand logo/image'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'name', 'description']
        },
        CartItem: {
          type: 'object',
          properties: {
            productId: {
              type: 'integer',
              description: 'The ID of the product in the cart'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product'
            },
            product: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                price: { type: 'number' },
                imageUrl: { type: 'string', nullable: true }
              }
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal for this item (price * quantity)'
            }
          },
          required: ['productId', 'quantity', 'product', 'subtotal']
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the cart'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal for all items'
            },
            tax: {
              type: 'number',
              description: 'Tax amount'
            },
            total: {
              type: 'number',
              description: 'Total amount including tax'
            },
            itemCount: {
              type: 'integer',
              description: 'Total number of items in cart'
            }
          },
          required: ['id', 'items', 'subtotal', 'tax', 'total', 'itemCount']
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the order'
            },
            userId: {
              type: 'string',
              description: 'ID of the user who placed the order'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'integer' },
                  productName: { type: 'string' },
                  quantity: { type: 'integer' },
                  unitPrice: { type: 'number' },
                  subtotal: { type: 'number' }
                }
              }
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal for all items'
            },
            tax: {
              type: 'number',
              description: 'Tax amount'
            },
            shipping: {
              type: 'number',
              description: 'Shipping cost'
            },
            total: {
              type: 'number',
              description: 'Total amount including tax and shipping'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled'],
              description: 'Current status of the order'
            },
            shippingAddress: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'userId', 'items', 'subtotal', 'tax', 'shipping', 'total', 'status', 'shippingAddress']
        },
        InventoryAudit: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The unique identifier for the audit entry'
            },
            productId: {
              type: 'integer',
              description: 'ID of the product being audited'
            },
            previousStock: {
              type: 'integer',
              description: 'Stock level before adjustment'
            },
            newStock: {
              type: 'integer',
              description: 'Stock level after adjustment'
            },
            adjustment: {
              type: 'integer',
              description: 'The amount adjusted (positive for increase, negative for decrease)'
            },
            reason: {
              type: 'string',
              nullable: true,
              description: 'Reason for the adjustment'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the adjustment occurred'
            }
          },
          required: ['id', 'productId', 'previousStock', 'newStock', 'adjustment', 'timestamp']
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Array of items in the current page',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total number of items'
                },
                limit: {
                  type: 'integer',
                  description: 'Number of items per page'
                },
                offset: {
                  type: 'integer',
                  description: 'Number of items skipped'
                },
                hasMore: {
                  type: 'boolean',
                  description: 'Whether there are more items available'
                }
              }
            }
          },
          required: ['data', 'pagination']
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            statusCode: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Invalid request parameters'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: 'The request was invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalError: {
          description: 'An internal server error occurred',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      },
      parameters: {
        PaginationLimit: {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of items to return',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        PaginationOffset: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          required: false,
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        },
        SortField: {
          name: 'sort',
          in: 'query',
          description: 'Field to sort by',
          required: false,
          schema: {
            type: 'string',
            enum: ['name', 'price'],
            default: 'name'
          }
        },
        SortOrder: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          }
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts'] // Path to the API controllers
};