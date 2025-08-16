# 🗄️ Step 2: Database Configuration Guide
*Consulted with Database Agent & DevOps Agent*

## Current Status
✅ **SQLite Database Operational** 
- Location: `/workspaces/mtg-investment-next/data/mtg-investment.db`
- Size: 77.8 KB (initialized with schema)
- Status: Production-ready for small to medium scale

---

## 🎯 Database Configuration Options

### Option 1: SQLite (Recommended - Already Configured) ⭐
**Best for**: Small to medium applications, simple deployments

**Pros:**
- ✅ Zero configuration required
- ✅ File-based, easy backups
- ✅ Perfect for < 100GB data
- ✅ Already working and tested
- ✅ No additional infrastructure needed

**Production Configuration:**
```bash
# .env.production
DATABASE_URL=file:./data/mtg-investment.db
```

**Deployment Notes:**
- Ensure `data/` directory is writable
- Include database file in deployment artifacts
- Set up regular backups of the `.db` file

---

### Option 2: PostgreSQL with Docker 🐳
**Best for**: Development consistency, easy local testing

**Setup Steps:**

1. **Create docker-compose.yml:**
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: mtg_investment
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password_change_this
      POSTGRES_INITDB_ARGS: "--encoding=UTF8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Your Next.js app
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:secure_password_change_this@postgres:5432/mtg_investment
    volumes:
      - ./data:/app/data

volumes:
  postgres_data:
```

2. **Create Database Init Script** (`database/init.sql`):
```sql
-- Create MTG Investment Database Schema
CREATE DATABASE IF NOT EXISTS mtg_investment;

-- Extensions for enhanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Switch to the database
\c mtg_investment;

-- Create optimized tables for MTG data
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mtgjson_uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    collector_number VARCHAR(20) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    colors TEXT[],
    mana_cost VARCHAR(100),
    cmc INTEGER,
    type_line VARCHAR(255),
    oracle_text TEXT,
    power VARCHAR(10),
    toughness VARCHAR(10),
    loyalty VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    price_date DATE NOT NULL,
    usd DECIMAL(10,2),
    usd_foil DECIMAL(10,2),
    eur DECIMAL(10,2),
    tix DECIMAL(10,2),
    source VARCHAR(50) DEFAULT 'mtgjson',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL, -- 'buy', 'sell'
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_cards_name ON cards USING gin(name gin_trgm_ops);
CREATE INDEX idx_cards_set_code ON cards(set_code);
CREATE INDEX idx_prices_card_date ON prices(card_id, price_date);
CREATE INDEX idx_prices_date ON prices(price_date);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. **Start PostgreSQL:**
```bash
docker-compose up -d postgres
```

4. **Environment Configuration:**
```bash
# .env.production
DATABASE_URL=postgresql://postgres:secure_password_change_this@localhost:5432/mtg_investment
```

---

### Option 3: Cloud Database Services 🌐
**Best for**: Production deployments, scalability

#### A. Vercel + PlanetScale
```bash
# Install PlanetScale CLI
curl https://get.planetscale.com/install.sh | bash

# Create database
pscale database create mtg-investment

# Get connection string
pscale connect mtg-investment main --port 3309

# .env.production
DATABASE_URL=mysql://username:password@host/mtg_investment?sslaccept=strict
```

#### B. Railway PostgreSQL
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL service
railway add postgresql

# Get DATABASE_URL from dashboard
```

#### C. Supabase
```bash
# Create project at https://supabase.com
# Get DATABASE_URL from project settings

# .env.production
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

---

## 🔧 Database Migration Script

For switching from SQLite to PostgreSQL, create `scripts/migrate-database.js`:

```javascript
const sqlite3 = require('sqlite3');
const { Client } = require('pg');

async function migrateSQLiteToPostgreSQL() {
  const sqliteDb = new sqlite3.Database('./data/mtg-investment.db');
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await pgClient.connect();
  
  // Migration logic here
  console.log('🔄 Database migration completed!');
}

migrateSQLiteToPostgreSQL().catch(console.error);
```

---

## 🎯 Database Agent Recommendations

**For most users**: Stick with SQLite (Option 1)
- ✅ Zero configuration
- ✅ Already working
- ✅ Perfect for MTG card data scale
- ✅ Easy backup and restore

**For scaling or team development**: PostgreSQL with Docker (Option 2)
- 🔧 More setup required
- 💪 Better concurrent handling
- 💪 Advanced features
- 🐳 Consistent environments

**For enterprise deployment**: Cloud services (Option 3)
- 💰 Additional cost
- 🚀 Managed and scalable
- 🔒 Built-in backups
- 🌐 Global availability

---

## ✅ Next Steps

1. **Choose your database option** (SQLite recommended)
2. **Update environment variables** accordingly
3. **Test database connectivity**
4. **Set up backup strategy**
5. **Proceed to Step 3: Deployment Platform Setup**

Would you like to proceed with SQLite (recommended) or set up PostgreSQL?
