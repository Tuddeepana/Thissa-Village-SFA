# 🚀 Backend Setup Guide

## Step-by-Step Setup Instructions

### 1️⃣ Install PostgreSQL (if not installed)

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer and remember your password
- Default port: 5432
- Default user: postgres

**Alternative - Use Docker:**
```bash
docker run --name vinopos-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2️⃣ Create Database

Open Command Prompt or PowerShell and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vinopos_db;

# Exit
\q
```

Or use pgAdmin (GUI tool that comes with PostgreSQL).

### 3️⃣ Configure Environment

The `.env` file is already created. Update if needed:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/vinopos_db?schema=public"
```

Replace `your_password` with your PostgreSQL password.

### 4️⃣ Initialize Prisma

Run these commands in the `backend` folder:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# When prompted, enter a name like: "init"
```

### 5️⃣ Seed Database (Optional but Recommended)

```bash
npm run prisma:seed
```

This creates:
- ✅ 5 categories
- ✅ 5 sample products  
- ✅ Admin user (admin@vinopos.com / admin123)

### 6️⃣ Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 VinoPOS Backend Server Started!
📡 Server running on: http://localhost:5000
```

### 7️⃣ Test the API

Open your browser and visit:
- http://localhost:5000 - Welcome page
- http://localhost:5000/health - Health check
- http://localhost:5000/api/categories - Categories list
- http://localhost:5000/api/products - Products list

## 🎯 Quick Commands Reference

```bash
# Start development server (with auto-reload)
npm run dev

# View database in GUI
npm run prisma:studio

# Create new migration
npx prisma migrate dev --name add_new_feature

# Reset database (careful - deletes all data!)
npx prisma migrate reset

# Build for production
npm run build

# Start production server
npm start
```

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `vinopos_db` created
- [ ] `.env` file configured with correct credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Migrations applied (`npm run prisma:migrate`)
- [ ] Database seeded (`npm run prisma:seed`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] API endpoints return data

## 🐛 Common Issues

### Issue: "Database connection failed"

**Solution:**
1. Check PostgreSQL is running
2. Verify password in `.env`
3. Ensure database exists

### Issue: "Port 5000 already in use"

**Solution:**
Change port in `.env`:
```env
PORT=3000
```

### Issue: "Prisma Client not found"

**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Migration failed"

**Solution:**
```bash
# Reset and start fresh
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:seed
```

## 📊 Prisma Studio

View and edit your database with a GUI:

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

## 🔗 Connect Frontend to Backend

Update your frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎉 You're Ready!

Your backend is now running and ready to handle requests from the frontend!

Next steps:
1. Keep the backend server running (`npm run dev`)
2. Start the frontend server
3. Start building your POS features!
