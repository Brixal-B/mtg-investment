#!/usr/bin/env node

/**
 * Day 3 Progress Test - Protected Routes & Profile Management
 * 
 * Tests the implementation of:
 * 1. Authentication middleware for protected routes
 * 2. Dashboard page with authentication check
 * 3. User profile API endpoint
 * 4. Session management
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkFileContent(filePath, searchTerms, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description}: File not found - ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missingTerms = searchTerms.filter(term => !content.includes(term));
  
  if (missingTerms.length === 0) {
    log(`✅ ${description}: All required content found`, 'green');
    return true;
  } else {
    log(`❌ ${description}: Missing - ${missingTerms.join(', ')}`, 'red');
    return false;
  }
}

function runDay3Tests() {
  log('\n=== DAY 3 PROGRESS TEST: Protected Routes & Profile ===\n', 'bold');

  let score = 0;
  let total = 0;

  // Test 1: Authentication Middleware
  log('1. Authentication Middleware', 'blue');
  total++;
  if (checkFileContent(
    'middleware.ts',
    ['NextResponse', 'jwtVerify', 'protected routes', '/dashboard'],
    'Middleware with JWT authentication'
  )) {
    score++;
  }

  // Test 2: Dashboard Page
  log('\n2. Dashboard Page', 'blue');
  total++;
  if (checkFileContent(
    'src/app/dashboard/page.tsx',
    ['Dashboard', 'useEffect', 'fetch', '/api/auth/me'],
    'Dashboard with user profile integration'
  )) {
    score++;
  }

  // Test 3: User Profile API
  log('\n3. User Profile API', 'blue');
  total++;
  if (checkFileContent(
    'src/app/api/auth/me/route.ts',
    ['GET', 'NextRequest', 'better-sqlite3', 'authService'],
    'User profile API with database integration'
  )) {
    score++;
  }

  // Test 4: Authentication Service JWT Methods
  log('\n4. Authentication Service Features', 'blue');
  total++;
  if (checkFileContent(
    'src/lib/auth-service.ts',
    ['getTokenFromRequest', 'verifyToken', 'generateToken'],
    'Auth service with JWT token handling'
  )) {
    score++;
  }

  // Test 5: Protected Route Configuration
  log('\n5. Protected Route Configuration', 'blue');
  total++;
  if (checkFileContent(
    'middleware.ts',
    ['config', 'matcher', '/dashboard'],
    'Middleware configuration for protected routes'
  )) {
    score++;
  }

  // Test 6: Security Headers
  log('\n6. Security Headers Implementation', 'blue');
  total++;
  if (checkFileContent(
    'middleware.ts',
    ['X-Frame-Options', 'X-Content-Type-Options', 'headers.set'],
    'Security headers in middleware'
  )) {
    score++;
  }

  // Calculate completion percentage
  const percentage = Math.round((score / total) * 100);

  log('\n=== DAY 3 SUMMARY ===', 'bold');
  log(`Completed: ${score}/${total} tasks (${percentage}%)`, percentage === 100 ? 'green' : 'yellow');

  if (percentage === 100) {
    log('🎉 Day 3 is COMPLETE! Protected routes and profile management are fully implemented.', 'green');
  } else {
    log(`📝 Day 3 is ${percentage}% complete. Continue working on remaining tasks.`, 'yellow');
  }

  // Additional file checks for completeness
  log('\n=== ADDITIONAL CHECKS ===', 'blue');
  
  const additionalFiles = [
    'package.json',
    'src/lib/auth-service.ts',
    'src/app/login/page.tsx',
    'src/app/register/page.tsx'
  ];

  additionalFiles.forEach(file => {
    checkFile(file, `Essential file exists`);
  });

  return percentage;
}

if (require.main === module) {
  const completionPercentage = runDay3Tests();
  process.exit(completionPercentage === 100 ? 0 : 1);
}

module.exports = { runDay3Tests };
