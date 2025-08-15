# Environment Variables Setup Guide

This guide covers how to set up and manage environment variables for the MTG Investment Tracking application.

## 📋 Quick Setup

### 1. For Development
```bash
# Copy the example file and customize
cp .env.example .env.local

# Or use our setup script
npm run env:init development
```

### 2. For Production
```bash
# Generate a secure JWT secret
npm run env:secret

# Copy and customize the production template
cp .env.production .env.production.local
# Then edit .env.production.local with your production values
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run env:status` | Show status of all environment files |
| `npm run env:init [env]` | Create environment file from template |
| `npm run env:validate [env]` | Validate environment configuration |
| `npm run env:secret` | Generate a secure JWT secret |

## 📁 Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Template for all environments | ✅ Yes |
| `.env.local` | Development environment | ❌ No |
| `.env.production` | Production template | ✅ Yes |
| `.env.test` | Test environment | ✅ Yes |

## 🔑 Required Variables

### Development
- `JWT_SECRET` - JWT signing secret (auto-generated for dev)
- `DATABASE_URL` - Database connection (defaults to SQLite)

### Production
- `JWT_SECRET` - **CRITICAL**: Must be 32+ character secure random string
- `DATABASE_URL` - Production database connection
- `CORS_ORIGINS` - Allowed domains (comma-separated)

## 🛡️ Security Best Practices

### JWT Secret Generation
```bash
# Generate secure 32+ character secret
npm run env:secret

# Or use OpenSSL
openssl rand -base64 32
```

### Environment File Security
- ✅ Never commit `.env.local` to git
- ✅ Use different secrets for each environment
- ✅ Rotate secrets regularly in production
- ❌ Don't use development secrets in production

## 🌍 Environment Variables Reference

### Core Configuration
```env
# Required
NODE_ENV=development|test|production
JWT_SECRET=your-secure-random-secret-32-chars-minimum

# Database
DATABASE_URL=file:./data/mtg-investment.db  # SQLite
DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL
```

### Security Settings
```env
SESSION_COOKIE_SECURE=false  # true in production
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### API Configuration
```env
API_RATE_LIMIT_MAX=100        # Requests per window
API_RATE_LIMIT_WINDOW=60000   # Window in milliseconds
```

### External Services
```env
# MTG JSON API
MTGJSON_API_URL=https://mtgjson.com/api/v5
MTGJSON_CACHE_DURATION=3600000

# Scryfall API  
SCRYFALL_API_URL=https://api.scryfall.com
SCRYFALL_RATE_LIMIT=100
```

### Development Tools
```env
DEBUG=mtg:*                   # Enable debug logging
NEXT_TELEMETRY_DISABLED=1     # Disable Next.js telemetry
GENERATE_SOURCEMAP=true       # Enable source maps
```

## 🚀 Production Deployment

### 1. Prepare Environment
```bash
# Generate production JWT secret
JWT_SECRET=$(npm run env:secret | tail -1)

# Set in your deployment environment
export JWT_SECRET="your-generated-secret"
export DATABASE_URL="your-production-database-url"
export CORS_ORIGINS="https://yourdomain.com"
```

### 2. Validate Configuration
```bash
npm run env:validate production
```

### 3. Common Deployment Platforms

#### Vercel
```bash
vercel env add JWT_SECRET
vercel env add DATABASE_URL
vercel env add CORS_ORIGINS
```

#### Heroku
```bash
heroku config:set JWT_SECRET="your-secret"
heroku config:set DATABASE_URL="your-db-url"
```

#### Docker
```dockerfile
# In Dockerfile
ENV NODE_ENV=production
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
```

## 🔍 Troubleshooting

### Common Issues

**JWT Warning in Development:**
```
⚠️ Using default JWT secret in development
```
- **Solution**: Ensure `.env.local` exists with a `JWT_SECRET` value

**Environment Not Loading:**
```
Error: Missing required environment variable: JWT_SECRET
```
- **Solution**: Check file naming (`.env.local` for development)
- **Solution**: Verify file is in project root directory

**Production Validation Errors:**
```
❌ Validation errors for .env.production:
   - JWT_SECRET is missing or using default value
```
- **Solution**: Generate a secure JWT secret for production
- **Solution**: Update production environment with real values

### Debug Environment Loading
```bash
# Check what Next.js is loading
npm run dev 2>&1 | grep "Loaded env"

# Test environment variable parsing
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.JWT_SECRET)"
```

## 📖 Further Reading

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Security Best Practices](./SECURITY_IMPLEMENTATION.md)
- [Database Configuration](./STEP_2_DATABASE_CONFIGURATION.md)
