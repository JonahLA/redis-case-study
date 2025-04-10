import express from 'express';
import { serverConfig } from './config/server';
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
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    server.close(async () => {
      console.log('Disconnecting from database...');
      await disconnectPrisma();
      console.log('Disconnecting from Redis...');
      await disconnectRedis();
      console.log('Server shutdown complete.');
      process.exit(0);
    });
  };

  // Listen for shutdown signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
