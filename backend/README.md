# VinoPOS Backend API

Node.js backend with Express, Prisma, and PostgreSQL for VinoPOS Pro.

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   └── index.ts           # Main application entry point
├── .env                   # Environment variables
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── nodemon.json          # Nodemon configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL Database

Create a PostgreSQL database:

```sql
CREATE DATABASE vinopos_db;
```

Or use the command line:

```bash
psql -U postgres
CREATE DATABASE vinopos_db;
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update the database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vinopos_db?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Run Prisma Migrations

Generate Prisma Client and create database tables:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run prisma:seed
```

This will create:
- 5 categories (Beverages, Bakery, Dairy, Snacks, Food)
- 5 sample products
- 1 admin user (email: admin@vinopos.com, password: admin123)

### 6. Start the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```


The server will start at `http://localhost:5000`

## 📡 API Endpoints

### General

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api` - API information
- `GET /api/test-db` - Test database connection

### Categories

- `GET /api/categories` - Get all categories

### Products

- `GET /api/products` - Get all products

## 🗄️ Database Schema

### Models

- **User** - System users (admin, manager, cashier)
- **Category** - Product categories
- **Product** - Products with stock management
- **Invoice** - Sales invoices
- **InvoiceItem** - Invoice line items

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data

## 🔧 Prisma Commands

### View Database in GUI

```bash
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555`

### Create a New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database

```bash
npx prisma migrate reset
```

## 🌐 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get categories
curl http://localhost:5000/api/categories

# Get products
curl http://localhost:5000/api/products

# Test database
curl http://localhost:5000/api/test-db
```

### Using Browser

Simply open:
- http://localhost:5000
- http://localhost:5000/health
- http://localhost:5000/api/categories
- http://localhost:5000/api/products

## 🔐 Default Credentials

After running the seed script:

- **Email**: admin@vinopos.com
- **Password**: admin123

## 📦 Dependencies

### Production
- `express` - Web framework
- `@prisma/client` - Prisma ORM client
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication

### Development
- `typescript` - TypeScript support
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes
- `prisma` - Prisma CLI
- `@types/*` - TypeScript type definitions

## 🛠️ Troubleshooting

### Database Connection Error

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify credentials in `.env`

3. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

Change the port in `.env`:
```env
PORT=3000
```

### Prisma Client Not Generated

Run:
```bash
npm run prisma:generate
```

## 📄 License

ISC
