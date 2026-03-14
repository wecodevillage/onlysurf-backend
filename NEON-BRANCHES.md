# Neon Database Branches Guide

This project uses **Neon PostgreSQL** with database branching for development. Each developer can work on their own isolated database branch.

## Setup

### 1. Install Neon CLI (Optional)

```bash
npm install -g neonctl
```

### 2. Set Up Environment Variables

Add to your `.env` file:

```bash
# Neon Configuration
NEON_PROJECT_ID=your-project-id
NEON_API_KEY=your-api-key

# Your branch connection string
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/onlysurf?sslmode=require
```

Get your Neon API key from: https://console.neon.tech/app/settings/api-keys

## Using Neon Branches

### Option 1: Using the Helper Script

```bash
# List all branches
./scripts/neon-branch.sh list

# Create a new branch for your feature
./scripts/neon-branch.sh create dev-yourname main

# Get connection string for a branch
./scripts/neon-branch.sh connect dev-yourname

# Delete a branch when done
./scripts/neon-branch.sh delete br-abc123
```

### Option 2: Using Neon CLI

```bash
# Authenticate
neonctl auth

# Set your project
neonctl set-context --project-id your-project-id

# List branches
neonctl branches list

# Create a new branch
neonctl branches create --name dev-yourname --parent main

# Get connection string
neonctl connection-string dev-yourname

# Delete a branch
neonctl branches delete dev-yourname
```

### Option 3: Using Neon Console UI

1. Go to https://console.neon.tech
2. Select your project
3. Navigate to "Branches"
4. Click "Create Branch"
5. Choose a name and parent branch
6. Copy the connection string to your `.env`

## Development Workflow

### 1. Create Your Feature Branch

```bash
# Create a new database branch for your feature
./scripts/neon-branch.sh create feature-auth main

# Update your .env with the new connection string
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/onlysurf"
```

### 2. Run Migrations

```bash
# Apply migrations to your branch
npx prisma migrate dev

# Or deploy migrations
npx prisma migrate deploy
```

### 3. Start Development

```bash
# Using Docker Compose
docker-compose up

# Or locally
npm run start:dev
```

### 4. Clean Up When Done

```bash
# Delete your branch after merging
./scripts/neon-branch.sh delete br-xyz123
```

## Branch Strategy

### Main Branch
- **Name**: `main`
- **Purpose**: Production schema
- **Usage**: Base for all feature branches

### Development Branches
- **Naming**: `dev-{username}` or `feature-{name}`
- **Purpose**: Personal development database
- **Lifecycle**: Created per developer or feature, deleted after merge

### Staging Branch (Optional)
- **Name**: `staging`
- **Purpose**: Pre-production testing
- **Usage**: Create from main, test before production deploy

## Benefits of Neon Branches

✅ **Instant Creation** - Branches are created in milliseconds using copy-on-write  
✅ **Isolated Development** - Each developer has their own database  
✅ **Cost Efficient** - Branches only store changes (deltas)  
✅ **Easy Reset** - Create a fresh branch from main anytime  
✅ **No Docker Required** - Direct cloud connection  

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Verify your connection string in `.env`
2. Ensure `sslmode=require` is in the URL
3. Check branch exists: `./scripts/neon-branch.sh list`

### WebSocket Errors (Local Development)

The `ws` package is configured for local development. If you have issues:

```bash
npm install ws
```

### Migration Errors

If migrations fail:

```bash
# Check Primsa configuration
npx prisma validate

# View migration status
npx prisma migrate status

# Reset database (⚠️ destructive)
npx prisma migrate reset
```

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Neon API Reference](https://api-docs.neon.tech/reference/getting-started-with-neon-api)
- [Prisma with Neon](https://www.prisma.io/docs/orm/overview/databases/neon)
