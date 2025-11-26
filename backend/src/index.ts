import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes

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
      products: '/api/products',
      categories: '/api/categories',
      invoices: '/api/invoices',
    },
  });
});

// Test database connection
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const usersCount = await prisma.user.count();
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();

    res.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        users: usersCount,
        products: productsCount,
        categories: categoriesCount,
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

// Get all categories
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

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

// Start server
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

export { app, prisma };
