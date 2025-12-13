# 🚀 Vercel + Supabase Deployment Guide

## Why Vercel?
- ✅ **Simpler** than Firebase Functions
- ✅ **Free tier** - Generous limits
- ✅ **Automatic deployments** from Git
- ✅ **Built-in environment variables**
- ✅ **Zero configuration** for Express.js
- ✅ **Instant HTTPS**

---

## 📋 Quick Deploy (10 Minutes)

### Step 1: Setup Supabase Database (5 min)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up / Log in
   - Click "New Project"

2. **Create Project**
   - Name: `thissa-village-sfa`
   - Database Password: (Create strong password - **SAVE IT!**)
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **Connection Pooling**
   - Copy the connection string (port **6543**, not 5432!)
   - Format: `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

4. **Deploy Database Schema**
   ```powershell
   # Set DATABASE_URL temporarily
   $env:DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING_HERE"
   
   # Push schema to Supabase
   npx prisma db push
   
   # Seed database with admin/cashier users
   npx tsx prisma/seed.ts
   ```

---

### Step 2: Deploy to Vercel (5 min)

#### Option A: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```powershell
   # If not already committed
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Sign up / Log in
   - Click **"New Project"**
   - **Import** your GitHub repository
   - **Root Directory**: Select `backend`
   - Click **"Deploy"**

3. **Set Environment Variables**
   - In Vercel dashboard → **Settings** → **Environment Variables**
   - Add these variables:

   | Name | Value | Notes |
   |------|-------|-------|
   | `DATABASE_URL` | Your Supabase connection string | Port 6543 |
   | `JWT_SECRET` | Generate secure random string (min 32 chars) | See below |
   | `CORS_ORIGIN` | `https://your-frontend-url.vercel.app` | Your frontend URL |
   | `NODE_ENV` | `production` | Environment |

4. **Generate JWT Secret**
   ```powershell
   # Run this to generate a secure secret
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
   ```

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment
   - OR just push new code (auto-deploys)

#### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Setup and deploy: Y
# - Scope: Select your account
# - Link to existing project: N
# - Project name: thissa-village-backend
# - Directory: ./
# - Override settings: N

# Set environment variables
vercel env add DATABASE_URL
# Paste your Supabase connection string

vercel env add JWT_SECRET
# Paste your generated secret

vercel env add CORS_ORIGIN
# Enter your frontend URL

# Production deploy
vercel --prod
```

---

## ✅ Verify Deployment

### Test Your API

```powershell
# Get your Vercel URL from deployment output
# Example: https://thissa-village-backend.vercel.app

# Health check
curl https://your-app.vercel.app/health

# Test login
curl -X POST https://your-app.vercel.app/api/users/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@vinopos.com\",\"password\":\"admin123\"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "admin@vinopos.com", ... },
    "token": "eyJhbGc..."
  }
}
```

---

## 🔄 Update & Redeploy

### Method 1: Git Push (Auto-deploy)
```powershell
# Make changes to your code
git add .
git commit -m "Update API"
git push origin main
# Vercel auto-deploys! 🎉
```

### Method 2: Manual Deploy
```powershell
vercel --prod
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default admin password (`admin123`)
- [ ] Change default cashier password (`cashier123`)
- [ ] Use strong JWT_SECRET (min 32 characters, random)
- [ ] Set correct CORS_ORIGIN (your frontend URL)
- [ ] Enable Supabase Row Level Security (optional)
- [ ] Review API rate limits in Vercel dashboard
- [ ] Set up monitoring/alerts

---

## 📊 Monitor Your App

### Vercel Dashboard
- **Analytics**: View request stats
- **Logs**: Real-time function logs
- **Deployments**: History and rollback

### Supabase Dashboard
- **Database**: Query and browse data
- **API**: Monitor usage
- **Logs**: Database query logs

---

## 🆘 Troubleshooting

### "Database connection failed"
**Cause**: Wrong connection string or Supabase not set up

**Solution**:
1. Verify you're using **Connection Pooling** URL (port 6543)
2. Check DATABASE_URL in Vercel environment variables
3. Ensure Supabase project is active

### CORS Errors
**Cause**: CORS_ORIGIN not set correctly

**Solution**:
```powershell
# Set in Vercel dashboard
CORS_ORIGIN=https://your-frontend.vercel.app

# Or allow all (development only!)
CORS_ORIGIN=*
```

### "Module not found" errors
**Cause**: Dependencies not installed

**Solution**:
- Ensure all dependencies are in `package.json`
- Redeploy from Vercel dashboard

### Cold Start (First request slow)
**Cause**: Vercel serverless cold starts

**Solution**:
- Normal on free tier (1-3 seconds)
- Upgrade to Pro for better performance
- Or implement keep-warm function

---

## 💰 Free Tier Limits

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 100 deployments/day
- ✅ Serverless function executions: 100GB-hours
- ✅ Unlimited projects
- ✅ Automatic HTTPS

### Supabase Free Tier
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users

**Both are perfect for development and small production apps!**

---

## 🎯 Production Deployment URL

After deployment, your API will be available at:
```
https://thissa-village-backend.vercel.app
```

Update your frontend to use this URL!

---

## 📱 Update Frontend

In your frontend `.env`:
```env
VITE_API_URL=https://your-backend.vercel.app
```

---

## 🚀 Next Steps

1. ✅ Test all API endpoints
2. ✅ Update frontend with production API URL
3. ✅ Deploy frontend to Vercel
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring
6. ✅ Plan for scaling

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## ✨ Advantages of Vercel

| Feature | Vercel | Firebase Functions |
|---------|--------|-------------------|
| Setup Complexity | ⭐ Simple | ⭐⭐⭐ Complex |
| Git Integration | ✅ Built-in | ❌ Manual |
| Environment Variables | ✅ Easy | ⭐⭐ Moderate |
| Cold Starts | ~1-2s | ~3-5s |
| Deployment Speed | ⚡ Fast | ⭐⭐ Slower |
| Logs & Monitoring | ✅ Excellent | ✅ Good |
| Free Tier | 🎁 Generous | 🎁 Good |

**Vercel is perfect for your Express.js backend!** 🎉
