# Week 1A: Real User Authentication Implementation

## Phase 1: Database User Management (Day 1)

### 1.1 Create Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'moderator'
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification ON users(verification_token);
CREATE INDEX idx_users_reset ON users(reset_token);
```

### 1.2 Update Collections Table
- Change `user_id TEXT DEFAULT 'default'` to proper foreign key
- Add user constraint: `FOREIGN KEY (user_id) REFERENCES users(id)`

### 1.3 Create User Sessions Table (Optional - for refresh tokens)
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Phase 2: Registration System (Day 1-2)

### 2.1 Registration API
- `/api/auth/register` POST endpoint
- Email validation
- Password strength requirements
- Email verification token generation

### 2.2 Registration Form Component
- Email, password, confirm password fields
- Terms of service acceptance
- Password strength indicator
- Form validation

### 2.3 Email Verification
- `/api/auth/verify-email` GET endpoint
- Email verification page/component
- Resend verification email functionality

## Phase 3: Enhanced Authentication (Day 2-3)

### 3.1 Password Reset
- `/api/auth/forgot-password` POST endpoint
- `/api/auth/reset-password` POST endpoint
- Password reset form components
- Secure token generation and validation

### 3.2 User Profile Management
- `/api/user/profile` GET/PUT endpoints
- Profile edit form component
- Change password functionality
- Account deletion option

### 3.3 Session Management
- Refresh token implementation
- "Remember me" functionality
- Active sessions management
- Logout from all devices

## Phase 4: Database Integration (Day 3)

### 4.1 Replace Mock Users
- Update auth service to use real database
- Migrate existing demo users to database
- Update all auth endpoints

### 4.2 User Data Migration
- Create migration script for existing collections
- Associate default collections with admin user
- Test data integrity

### 4.3 Security Enhancements
- Rate limiting for auth endpoints
- CSRF protection
- Input sanitization
- Audit logging

## Testing Strategy

### Unit Tests
- [ ] User registration validation
- [ ] Password hashing/verification
- [ ] JWT token generation/verification
- [ ] Email verification flow

### Integration Tests
- [ ] Full registration flow
- [ ] Login/logout functionality
- [ ] Password reset process
- [ ] Protected route access

### End-to-End Tests
- [ ] User signup journey
- [ ] Login and access portfolio
- [ ] Password reset flow

## Demo Credentials Migration
```
Admin User:
- Email: admin@mtginvestment.com
- Password: admin123
- Role: admin

Regular User:
- Email: user@mtginvestment.com  
- Password: user123
- Role: user
```

## Security Checklist
- [ ] Passwords properly hashed with bcrypt
- [ ] JWT secrets properly configured
- [ ] Email verification required
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced in production
- [ ] Secure cookie settings
- [ ] SQL injection protection
