# 🚀 Production Deployment Checklist

## Step 1: Environment Variables Setup ✅

### 1.1 Generate Secure Secrets
We've generated cryptographically secure secrets for you:

```bash
# JWT Secret (256-bit)
JWT_SECRET=a30c94f27e2cfce7c9c6a3aab12420f1bb11ff1768a3a21a694fc1e17a4eb2928cf22b0d5c3b06a3f8e27fa97357ea4c1fd7a1e9a6af583d834994b44edaac44

# NextAuth Secret (256-bit)  
NEXTAUTH_SECRET=867a9136d1dae8b1af4ded233c2f8cd2cee8fee304a9d04f8da4dfbeed0022f7a0311135bbe652e15f5397ebe1d22fb0ab2b57238304b8b99b6900cc8e9f27fb

# Admin Session Key (256-bit)
ADMIN_SESSION_SECRET=b4c226de8b718495db6e54d6247969c70b1c705b450c27ce1ad199f30517668778a693eff48061ed4e9b51e8e152976cee0ad55718fe95e538a1c7138c0a1507
```

### 1.2 Environment File Setup

**Option A: Copy the template**
```bash
cp .env.production.example .env.production
```

**Option B: Create manually**
Create a `.env.production` file with the generated secrets above.

### 1.3 Required Environment Variables

✅ **SECURITY (CRITICAL)**
- `JWT_SECRET` - Token signing key
- `NEXTAUTH_SECRET` - NextAuth session key  
- `ADMIN_SESSION_SECRET` - Admin session key

✅ **DATABASE (REQUIRED)**
- `DATABASE_URL` - Database connection string

✅ **ADMIN ACCESS (REQUIRED)**
- `ADMIN_DEFAULT_USERNAME` - Admin login email
- `ADMIN_DEFAULT_PASSWORD` - Admin login password

✅ **PRODUCTION SETTINGS (RECOMMENDED)**
- `NODE_ENV=production`
- `SESSION_COOKIE_SECURE=true`
- `SESSION_COOKIE_DOMAIN=yourdomain.com`
- `CORS_ORIGINS=https://yourdomain.com`

## Step 2: Database Configuration

### Database Agent Consultation Results ✅

**Current Status**: SQLite database operational (76 KB, 6 tables)
**Recommendation**: Continue with SQLite for production

### 2.1 SQLite Configuration (Recommended)
```bash
# Production environment
DATABASE_URL=file:./data/mtg-investment.db

# Verify database
npm run db:check

# Create backup
npm run db:backup
```

### 2.2 Alternative: PostgreSQL Setup
```bash
# Generate Docker setup files
npm run db:postgres:setup

# Start PostgreSQL
docker-compose up -d postgres

# Test connection
npm run db:postgres:test

# Update environment
DATABASE_URL=postgresql://postgres:secure_password_change_this@localhost:5432/mtg_investment
```

### 2.3 Database Management Commands
```bash
npm run db:check         # Check database status
npm run db:backup        # Create backup
npm run db:info          # Database information
npm run db:vacuum        # Optimize database
```

## Step 3: Deployment Platform Setup

### Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment:
```bash
# Build image
docker build -t mtg-investment .

# Run container
docker run -d -p 3000:3000 --env-file .env.production mtg-investment
```

### Railway/Render Deployment:
1. Connect GitHub repository
2. Set environment variables in platform dashboard
3. Deploy automatically

## Step 4: Security Verification

### 4.1 Test Security Endpoints
```bash
# Check security dashboard
curl https://yourdomain.com/api/admin/security-dashboard

# Verify rate limiting
curl -H "Content-Type: application/json" https://yourdomain.com/api/auth/login
```

### 4.2 Security Checklist
- [ ] JWT secrets are not hardcoded
- [ ] HTTPS is enabled
- [ ] Environment variables are set
- [ ] Database is secured
- [ ] Rate limiting is active
- [ ] CORS is configured
- [ ] Admin credentials are changed

## Step 5: Post-Deployment Testing

### 5.1 Application Health
- [ ] Homepage loads correctly
- [ ] Admin login works
- [ ] Database operations function
- [ ] API endpoints respond
- [ ] Security monitoring active

### 5.2 Performance Monitoring
- [ ] Check response times
- [ ] Monitor memory usage
- [ ] Verify download functionality
- [ ] Test import processes

## Step 6: Monitoring & Maintenance

### 6.1 Log Monitoring
```bash
# Check application logs
tail -f /var/log/app.log

# Monitor security events
curl https://yourdomain.com/api/admin/security-dashboard
```

### 6.2 Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Monitor security alerts
- [ ] Backup database regularly
- [ ] Review access logs weekly

## 🆘 Troubleshooting

### Environment Variable Issues:
```bash
# Check if variables are loaded
node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET loaded' : 'JWT_SECRET missing')"
```

### Database Connection Issues:
```bash
# Test database connection
npm run db:test
```

### Security Issues:
```bash
# Check security status
curl https://yourdomain.com/api/admin/system-metrics
```

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Review security configuration
5. Check the `SECURITY_IMPLEMENTATION.md` file

---

**🎉 Congratulations! Your MTG Investment app is now production-ready with enterprise-grade security!**
