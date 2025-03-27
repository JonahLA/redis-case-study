import express from 'express';
import { serverConfig } from './config/server';
import { errorMiddleware } from './middleware/errorMiddleware';
import healthRoutes from './controllers/healthController';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/health', healthRoutes);

// Error handling
app.use(errorMiddleware);

// Only start the server if this file is run directly
if (require.main === module) {
  const server = app.listen(serverConfig.port, () => {
    console.log(`Server is running on port ${serverConfig.port}`);
  });
}

export default app;
