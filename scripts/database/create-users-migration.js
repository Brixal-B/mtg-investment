/**
 * Database Migration: Create Users Table
 * This migration adds real user management to the MTG Investment platform
 */

const sqlite3 = require('sqlite3');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');

async function createUsersTableMigration(dbPath) {
  return new Promise((resolve, reject) => {
    console.log('🔄 Starting users table migration...');
    
    // Open database connection
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject({ success: false, message: 'Failed to open database', error: err.message });
        return;
      }
    });

    // Enable foreign keys and WAL mode
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run('PRAGMA journal_mode = WAL');
      
      // Check if users table already exists
      db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`, (err, row) => {
        if (err) {
          reject({ success: false, message: 'Failed to check table existence', error: err.message });
          return;
        }
        
        if (row) {
          console.log('⚠️  Users table already exists, skipping creation...');
          db.close();
          resolve({ success: true, message: 'Users table already exists' });
          return;
        }
        
        // Create users table
        console.log('📝 Creating users table...');
        db.run(`
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            role TEXT DEFAULT 'user',
            email_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT,
            reset_token TEXT,
            reset_token_expires DATETIME,
            last_login_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject({ success: false, message: 'Failed to create users table', error: err.message });
            return;
          }
          
          // Create indexes for performance
          console.log('🔍 Creating indexes...');
          const indexes = [
            'CREATE INDEX idx_users_email ON users(email)',
            'CREATE INDEX idx_users_verification ON users(verification_token)',
            'CREATE INDEX idx_users_reset ON users(reset_token)',
            'CREATE INDEX idx_users_role ON users(role)'
          ];
          
          let indexCount = 0;
          indexes.forEach(indexSql => {
            db.run(indexSql, (err) => {
              if (err) console.warn(`Warning: ${err.message}`);
              indexCount++;
              if (indexCount === indexes.length) {
                createSessionsTable();
              }
            });
          });
        });
        
        function createSessionsTable() {
          // Create sessions table for refresh tokens
          console.log('🔐 Creating user sessions table...');
          db.run(`
            CREATE TABLE user_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              refresh_token TEXT NOT NULL,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) {
              reject({ success: false, message: 'Failed to create sessions table', error: err.message });
              return;
            }
            
            const sessionIndexes = [
              'CREATE INDEX idx_sessions_user ON user_sessions(user_id)',
              'CREATE INDEX idx_sessions_token ON user_sessions(refresh_token)',
              'CREATE INDEX idx_sessions_expires ON user_sessions(expires_at)'
            ];
            
            let sessionIndexCount = 0;
            sessionIndexes.forEach(indexSql => {
              db.run(indexSql, (err) => {
                if (err) console.warn(`Warning: ${err.message}`);
                sessionIndexCount++;
                if (sessionIndexCount === sessionIndexes.length) {
                  migrateDemoUsers();
                }
              });
            });
          });
        }
        
        async function migrateDemoUsers() {
          // Migrate demo users to real users table
          console.log('👥 Migrating demo users...');
          
          try {
            const adminPasswordHash = await bcrypt.hash('admin123', 12);
            const userPasswordHash = await bcrypt.hash('user123', 12);
            
            const adminId = randomUUID();
            const userId = randomUUID();
            const now = new Date().toISOString();
            
            db.run(`
              INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [adminId, 'admin@mtginvestment.com', adminPasswordHash, 'Admin User', 'admin', 1, now], (err) => {
              if (err) {
                reject({ success: false, message: 'Failed to create admin user', error: err.message });
                return;
              }
              
              db.run(`
                INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [userId, 'user@mtginvestment.com', userPasswordHash, 'Regular User', 'user', 1, now], (err) => {
                if (err) {
                  reject({ success: false, message: 'Failed to create regular user', error: err.message });
                  return;
                }
                
                console.log('✅ Demo users migrated successfully');
                updateCollectionsTable(adminId);
              });
            });
          } catch (error) {
            reject({ 
              success: false, 
              message: 'Failed to hash passwords', 
              error: error.message 
            });
          }
        }
        
        function updateCollectionsTable(adminId) {
          // Update collections table to use proper foreign keys
          console.log('🔗 Updating collections table for user relationships...');
          
          // First, update all existing collections to use admin user ID
          db.run(`UPDATE collections SET user_id = ? WHERE user_id = 'default'`, [adminId], function(err) {
            if (err) {
              reject({ success: false, message: 'Failed to update collections', error: err.message });
              return;
            }
            
            const updatedRecords = this.changes;
            console.log(`📊 Updated ${updatedRecords} collection records to admin user`);
            
            console.log('✅ Collections table updated successfully');
            
            // Create trigger to update updated_at timestamp
            console.log('⏰ Creating update timestamp triggers...');
            
            db.run(`
              CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
              AFTER UPDATE ON users
              BEGIN
                UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
              END
            `, (err) => {
              if (err) console.warn(`Warning: ${err.message}`);
              
              db.run(`
                CREATE TRIGGER IF NOT EXISTS update_collections_timestamp 
                AFTER UPDATE ON collections
                BEGIN
                  UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END
              `, (err) => {
                if (err) console.warn(`Warning: ${err.message}`);
                
                console.log('✅ Created update timestamp triggers');
                
                db.close((err) => {
                  if (err) {
                    reject({ success: false, message: 'Failed to close database', error: err.message });
                  } else {
                    resolve({
                      success: true,
                      message: `Users table migration completed successfully. Migrated demo users and updated ${updatedRecords} collection records.`
                    });
                  }
                });
              });
            });
          });
        }
      });
    });
  });
}

// CLI execution
if (require.main === module) {
  const dbPath = process.argv[2] || './data/mtg-investment.db';
  
  createUsersTableMigration(dbPath)
    .then((result) => {
      if (result.success) {
        console.log('🎉', result.message);
        process.exit(0);
      } else {
        console.error('💥', result.message);
        if (result.error) {
          console.error('Error details:', result.error);
        }
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createUsersTableMigration };
