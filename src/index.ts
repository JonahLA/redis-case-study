import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { serverConfig } from './config/server';
import { swaggerOptions } from './config/swagger';
import { errorMiddleware } from './middleware/errorMiddleware';
import healthRoutes from './controllers/healthController';
import categoryRoutes from './controllers/categoryController';
import brandRoutes from './controllers/brandController';
import productRoutes from './controllers/productController';
import cartRoutes from './controllers/cartController';
import orderRoutes from './controllers/orderController';
import inventoryRoutes from './controllers/inventoryController';
import { disconnectPrisma } from './lib/prisma';
import { disconnectRedis } from './lib/redis';

const app = express();

// Middleware
app.use(express.json());

// Generate Swagger specification
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', orderRoutes);

// Error handling
app.use(errorMiddleware);

// Only start the server if this file is run directly
if (require.main === module) {
  const server = app.listen(serverConfig.port, () => {
    console.log(`Server is running on port ${serverConfig.port}`);
    console.log(`Swagger documentation available at http://localhost:${serverConfig.port}/api-docs`);
  });

  // Cleanup on server shutdown
  const cleanup = async () => {
    console.log('Shutting down server...');
    await Promise.all([
      disconnectPrisma(),
      disconnectRedis()
    ]);
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

export default app;
