import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import invoiceRoutes from './routes/invoice.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'VinoPOS Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Hello World
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to VinoPOS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// API base route
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'VinoPOS API v1',
    endpoints: {
      users: '/api/users',
      categories: '/api/categories',
    },
  });
});

// Test database connection
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const usersCount = await prisma.user.count();
    

    res.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        users: usersCount,
      },
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});



// 404 handler - Must be after all routes
app.use(notFoundHandler);

// Error handling middleware - Must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server (only in development, not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('🚀 VinoPOS Backend Server Started!');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Not configured'}`);
    console.log('\n📍 Available endpoints:');
    console.log(`   GET  /              - Welcome message`);
    console.log(`   GET  /health        - Health check`);
    console.log(`   GET  /api           - API info`);
    console.log(`   GET  /api/test-db   - Test database connection`);
    console.log(`   GET  /api/categories - Get all categories`);
    console.log(`   GET  /api/products  - Get all products`);
    console.log('\n✨ Ready to accept requests!\n');
  });
}

// Export for Vercel
export default app;
export { app, prisma };
