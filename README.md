# OnlySurf Backend API

API-first surf coaching and progression platform built with NestJS, deployed on Vercel Fluid Compute.

## 🏄‍♂️ Overview

OnlySurf is a comprehensive platform connecting surf coaches with athletes, featuring:

- **Video-based coaching** - Upload, tag, score, and provide feedback on surf sessions
- **Multi-tenant academies** - Surf schools can manage multiple coaches and athletes
- **Personal progression tracking** - Athletes save and review their best waves
- **Subscription-based billing** - Flexible plans for coaches and athletes via Stripe
- **Automatic video archiving** - Smart retention based on saved waves and subscription tiers

## 🛠️ Tech Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** Firebase Admin SDK
- **Video Processing:** Mux
- **Caching:** Upstash Redis
- **Billing:** Stripe
- **Email:** Resend
- **Deployment:** Vercel Fluid Compute

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Firebase project with Admin SDK credentials
- Mux account for video processing
- Upstash Redis instance
- Stripe account with test/live keys
- Resend account for transactional emails

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd onlysurf-backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Fill in all required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# And more...
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Development Server

Start the development server:

```bash
npm run start:dev
```

API will be available at `http://localhost:3000/v1`

Health check: `http://localhost:3000/v1/health`

## 📚 API Documentation

## 📡 API Documentation

### API Versioning

The API uses **URI Versioning** following [NestJS best practices](https://docs.nestjs.com/techniques/versioning):

- **Current Version:** v1
- **Versioning Type:** URI (`/v1/`, `/v2/`, etc.)
- **Default Version:** 1 (configured in `main.ts`)

For details on adding future versions, see [VERSIONING.md](./VERSIONING.md).

### Base URL

```
Development: http://localhost:3000/v1
Production: https://your-domain.vercel.app/v1
```

### Complete Endpoint List

See [API-ENDPOINTS.md](./API-ENDPOINTS.md) for the complete list of all available endpoints.

### Authentication

All endpoints (except public ones) require Firebase authentication:

```http
Authorization: Bearer <firebase-id-token>
```

### Core Endpoints

**Quick Reference** (see [API-ENDPOINTS.md](./API-ENDPOINTS.md) for complete details):

#### Health
- `GET /v1/health` - Health check (public)

#### Authentication
- `POST /v1/auth/session` - Create user session (public)
- `GET /v1/me` - Get current user
- `PATCH /v1/me/profile` - Update user profile

#### Academies
- `POST /v1/academies` - Create academy (coaches only)
- `GET /v1/academies/:id` - Get academy details
- `PATCH /v1/academies/:id` - Update academy
- `GET /v1/academies/:id/members` - List members
- `POST /v1/academies/:id/invites` - Invite member

#### Athletes
- `GET /v1/athletes` - List athletes
- `GET /v1/athletes/:id` - Get athlete details
- `GET /v1/athletes/:id/stats` - Get athlete statistics

#### Sessions
- `POST /v1/sessions` - Create session
- `GET /v1/sessions` - List sessions
- `GET /v1/sessions/:id` - Get session details
- `PATCH /v1/sessions/:id` - Update session
- `DELETE /v1/sessions/:id` - Delete session
- `POST /v1/sessions/:id/roster` - Add athlete to session
- `GET /v1/sessions/:id/summary` - Get session summary

#### Waves
- `POST /v1/waves` - Create wave
- `GET /v1/waves` - List waves
- `GET /v1/waves/:id` - Get wave details
- `PATCH /v1/waves/:id` - Update wave
- `DELETE /v1/waves/:id` - Delete wave
- `POST /v1/waves/:id/tags` - Tag athlete in wave
- `POST /v1/waves/:id/scores` - Add score
- `POST /v1/waves/:id/notes` - Add note
- `GET /v1/waves/:id/download` - Get download URL

#### Saved Waves
- `POST /v1/saved-waves` - Save wave to archive
- `GET /v1/saved-waves` - List saved waves
- `DELETE /v1/saved-waves/:id` - Remove from archive

#### Media (Mux)
- `POST /v1/media/mux/uploads` - Create direct upload URL
- `POST /v1/media/mux/webhook` - Handle Mux webhooks (public)

#### Billing (Stripe)
- `GET /v1/billing/plans` - List subscription plans (public)
- `POST /v1/billing/checkout` - Create checkout session
- `POST /v1/billing/portal` - Create customer portal session
- `POST /v1/billing/webhook` - Handle Stripe webhooks (public)

## 💳 Subscription Plans

### Coach Plans

| Plan | Price | Athletes | Sessions/mo | Video mins/mo | Coaches |
|------|-------|----------|-------------|---------------|---------|
| Starter | €19.99 | 10 | 20 | 120 | 1 |
| Pro | €39.99 | 40 | 80 | 600 | 3 |
| Academy | €99.99 | 150 | 300 | 2000 | Unlimited |

### Athlete Plans

| Plan | Price | Features |
|------|-------|----------|
| Free | €0 | View tagged waves, Download |
| Pro Surfer | €4.99 | + Free surf sessions, Save waves (300 min), Statistics |

## 🗄️ Database Schema

Key entities:
- **User** - Platform accounts (Firebase UID)
- **Profile** - User profile information
- **Academy** - Surf schools
- **AcademyMembership** - User-academy relationships
- **Session** - Training sessions
- **Wave** - Individual wave clips
- **SavedWave** - Archived waves for athletes
- **VideoAsset** - Mux video references
- **Subscription** - Stripe billing records
- **Score/Note** - Coach feedback

## 🔧 Development

### Database Management

```bash
# Open Prisma Studio
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run e2e tests
npm run test:e2e
```

## 🚢 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   vercel link
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add FIREBASE_PROJECT_ID
   # ... add all other variables
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Webhook Configuration

After deployment, configure webhook URLs:

**Mux Webhooks**
- URL: `https://your-domain.vercel.app/v1/media/mux/webhook`
- Events: `video.asset.ready`, `video.asset.errored`

**Stripe Webhooks**
- URL: `https://your-domain.vercel.app/v1/billing/webhook`
- Events: `customer.subscription.*`, `invoice.payment.*`

## 📁 Project Structure

```
src/
├── auth/                # Firebase authentication
├── common/             # Shared decorators, guards, utilities
├── config/             # Configuration files
├── health/             # Health check endpoint
├── prisma/             # Database service
├── v1/                 # API v1 feature modules
│   ├── academies/      # Academy management
│   ├── athletes/       # Athlete profiles
│   ├── billing/        # Stripe integration
│   ├── media/          # Mux video processing
│   ├── saved-waves/    # Wave archiving
│   ├── sessions/       # Session management
│   └── waves/          # Wave clips & feedback
├── app.module.ts       # Root module
├── main.ts            # Application entry (sets /v1 prefix)
└── serverless.ts      # Vercel adapter

prisma/
└── schema.prisma      # Database schema
```

### API Versioning

The API uses route-based versioning with a global `/v1` prefix. All routes automatically become:
- `/v1/health`
- `/v1/auth/session`
- `/v1/academies/:id`
- `/v1/sessions`
- etc.

When you need v2, you can:
1. Create a `src/v2/` folder with new modules
2. Update controllers to use explicit version prefixes: `@Controller('v2/academies')`
3. Import both v1 and v2 modules in AppModule

See [VERSIONING.md](./VERSIONING.md) for detailed versioning strategy.

## 🔐 Security

- **Authentication:** Firebase JWT tokens
- **Authorization:** Role-based access control (RBAC)
- **Rate Limiting:** Global throttling via @nestjs/throttler
- **Webhook Verification:** Signature validation for Mux/Stripe
- **Environment Variables:** Never commit sensitive data
- **CORS:** Configured allowlist for origins

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the maintainers for contribution guidelines.

## 📞 Support

For issues or questions, please contact the development team.

---

Built with ❤️ by the OnlySurf team
