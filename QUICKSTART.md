# Quick Start Guide

This guide will help you get the OnlySurf backend API up and running locally.

## Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 18+ (`node --version`)
- ✅ npm (`npm --version`)
- ✅ Git

## Step 1: Clone & Install

```bash
git clone <repository-url>
cd onlysurf-backend
npm install
```

## Step 2: Database Setup (Neon Serverless PostgreSQL)

This project uses **Neon** with database branching for development. No local PostgreSQL container needed!

### 1. Create Neon Account & Project

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project called "OnlySurf"
3. Copy your connection string from the dashboard

### 2. Create Your Development Branch

**Option A: Using the helper script**

```bash
# Set your Neon credentials in .env first
export NEON_PROJECT_ID=your-project-id
export NEON_API_KEY=your-api-key

# Create a personal dev branch
./scripts/neon-branch.sh create dev-yourname main

# Get the connection string
./scripts/neon-branch.sh connect dev-yourname
```

**Option B: Using Neon Console**

1. Go to your Neon project dashboard
2. Click "Branches" → "Create Branch"
3. Name it `dev-yourname` (or any name)
4. Select `main` as parent
5. Copy the connection string

**Option C: Use the main branch directly**

Just use the default `main` branch connection string for quick testing.

### 3. Why Neon Branches?

- ✅ **Instant creation** - Branches are created in milliseconds
- ✅ **Isolated development** - Each developer has their own database
- ✅ **Cost efficient** - Branches only store changes
- ✅ **Cloud-based** - No Docker or local PostgreSQL needed
- ✅ **Serverless optimized** - Perfect for Vercel deployment

📖 See [NEON-BRANCHES.md](NEON-BRANCHES.md) for detailed branch management guide.

## Step 3: Configure Environment

```bash
cp .env.example .env
```

**Minimum required for local development:**

```env
# Database
DATABASE_URL="postgresql://..." # Your database URL

# Firebase (Get from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Mux (Sign up at mux.com)
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret

# Redis (Sign up at upstash.com)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Stripe (Get from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs (Create products in Stripe first)
STRIPE_PRICE_COACH_STARTER_MONTHLY=price_...
STRIPE_PRICE_COACH_PRO_MONTHLY=price_...
STRIPE_PRICE_ACADEMY_MONTHLY=price_...
STRIPE_PRICE_PRO_SURFER_MONTHLY=price_...

# Resend (Get from resend.com)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
PORT=3000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGINS=http://localhost:3001
```

## Step 4: Generate Prisma Client & Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Create initial migration
npm run prisma:migrate

# View database in Prisma Studio (optional)
npm run prisma:studio
```

## Step 5: Start Development Server

```bash
npm run start:dev
```

You should see:
```
🚀 OnlySurf API running on: http://localhost:3000/v1
🌍 Environment: development
📊 Health check: http://localhost:3000/v1/health
```

## Step 6: Test the API

### Health Check
```bash
curl http://localhost:3000/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-03-04T...",
  "service": "onlysurf-api",
  "version": "v1"
}
```

### Get Subscription Plans
```bash
curl http://localhost:3000/v1/billing/plans
```

## Common Issues

### Issue: Prisma Client not found
**Solution:**
```bash
npm run prisma:generate
```

### Issue: Database connection error
**Solution:**
- Check your `DATABASE_URL` in `.env`
- Ensure database is running
- For Neon, verify the connection string includes `?sslmode=require`

### Issue: Firebase authentication error
**Solution:**
- Verify `FIREBASE_PRIVATE_KEY` has proper line breaks: `\n`
- Check `FIREBASE_CLIENT_EMAIL` is correct
- Ensure service account has proper permissions

### Issue: Port 3000 already in use
**Solution:**
```bash
# Change PORT in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. **Set up Firebase:**
   - Create a Firebase project
   - Enable Authentication
   - Download service account JSON
   - Extract credentials for `.env`

2. **Configure Stripe:**
   - Create products and prices
   - Add price IDs to `.env`
   - Set up webhook endpoint (after deployment)

3. **Set up Mux:**
   - Create Mux account
   - Generate API tokens
   - Configure webhook endpoint (after deployment)

4. **Test endpoints:**
   - Use Postman or Insomnia
   - Import the API collection (if available)
   - Test authentication flow

## Development Workflow

```bash
# Start dev server with hot reload
npm run start:dev

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test

# Open Prisma Studio
npm run prisma:studio

# Create a new migration
npm run prisma:migrate
```

## Useful Commands

```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# View database with Prisma Studio
npm run prisma:studio

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Generate Prisma client
npm run prisma:generate
```

## Getting API Documentation

The API follows RESTful conventions:

- **Base URL:** `http://localhost:3000/v1`
- **Auth:** `Authorization: Bearer <firebase-token>`
- **Content-Type:** `application/json`

See [README.md](./README.md) for full endpoint documentation.

## Need Help?

- Check the main [README.md](./README.md)
- Review [agents.md](./agents.md) for project requirements
- Check application logs in the terminal
- Use Prisma Studio to inspect the database

---

Happy coding! 🏄‍♂️
