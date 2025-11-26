# ⚡ Quick Reference Card

## 🎯 Most Used Commands

```bash
# Start development server
npm run dev

# View database in browser
npm run prisma:studio

# Test database connection
npm run test-db
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Welcome message |
| GET | /health | Health check |
| GET | /api | API info |
| GET | /api/test-db | Test DB connection |
| GET | /api/categories | List all categories |
| GET | /api/products | List all products |

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/vinopos_db?schema=public"
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 🗄️ Database Models

```
User
├── id (UUID)
├── email (unique)
├── password (hashed)
├── name
├── role (admin/manager/cashier)
└── isActive

Category
├── id (UUID)
├── name (unique)
├── description
└── products []

Product
├── id (UUID)
├── name
├── barcode (unique)
├── price
├── cost
├── stock
├── minStock
├── categoryId
└── category

Invoice
├── id (UUID)
├── invoiceNumber (unique)
├── customerName
├── customerPhone
├── subtotal
├── tax, taxRate
├── discount, discountRate
├── total
├── paymentMethod
├── amountPaid, change
└── items []

InvoiceItem
├── id (UUID)
├── invoiceId
├── productId
├── quantity
├── unitPrice
└── subtotal
```

## 🔧 Prisma Commands

```bash
# Generate client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database
npx prisma migrate reset
```

## 🏗️ Project Structure

```
backend/
├── prisma/          # Database schema & seed
├── src/             # Source code
├── dist/            # Compiled code (after build)
├── .env             # Environment variables
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## 🚀 Getting Started

1. **Setup Database**
   ```bash
   createdb vinopos_db
   ```

2. **Configure .env**
   ```bash
   # Edit DATABASE_URL with your credentials
   ```

3. **Initialize**
   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start Server**
   ```bash
   npm run dev
   ```

5. **Test**
   ```
   Open: http://localhost:5000
   ```

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (planned)

## 🎓 Default Credentials

After seeding:
- **Email**: admin@vinopos.com
- **Password**: admin123

## 🐛 Troubleshooting

**Port in use?**
```bash
# Change PORT in .env
PORT=3000
```

**DB connection failed?**
```bash
# Check PostgreSQL is running
pg_isready

# Verify .env DATABASE_URL
```

**Prisma errors?**
```bash
# Regenerate client
npm run prisma:generate
```

## 📞 Support

Check these files for detailed help:
- `README.md` - Full documentation
- `SETUP.md` - Step-by-step setup
- `FOLDER_STRUCTURE.md` - Project organization

## ✅ Health Check

Visit: http://localhost:5000/health

Should return:
```json
{
  "status": "ok",
  "message": "VinoPOS Backend API is running",
  "timestamp": "2025-11-26T..."
}
```
