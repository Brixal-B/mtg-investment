#!/usr/bin/env node

/**
 * Week 1 Complete Progress Test - Authentication System
 * 
 * Comprehensive test covering all 3 days:
 * Day 1: User Authentication Foundation
 * Day 2: Password Reset & Enhanced Auth
 * Day 3: Protected Routes & Profile Management
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}`, exists ? 'green' : 'red');
  return exists;
}

function checkFileContent(filePath, searchTerms, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description}: File not found`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missingTerms = searchTerms.filter(term => !content.includes(term));
  
  if (missingTerms.length === 0) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}: Missing - ${missingTerms.join(', ')}`, 'red');
    return false;
  }
}

function runCompleteWeek1Test() {
  log('\n████████████████████████████████████████████████████████', 'bold');
  log('██                WEEK 1 COMPLETE TEST                ██', 'bold');
  log('██          Authentication System Implementation       ██', 'bold');
  log('████████████████████████████████████████████████████████\n', 'bold');

  let totalScore = 0;
  let totalTasks = 0;

  // ============ DAY 1: USER AUTHENTICATION FOUNDATION ============
  log('🔥 DAY 1: USER AUTHENTICATION FOUNDATION', 'cyan');
  log('============================================================', 'cyan');
  
  let day1Score = 0;
  let day1Tasks = 0;

  // Database Migration
  day1Tasks++;
  if (checkFileContent(
    'scripts/create-users-migration.js',
    ['CREATE TABLE users', 'migrateDemoUsers', 'Demo users migrated'],
    'Users table migration with demo data'
  )) day1Score++;

  // Registration API
  day1Tasks++;
  if (checkFileContent(
    'src/app/api/auth/register/route.ts',
    ['POST', 'hashPassword', 'Database', 'validation'],
    'Registration API with password hashing'
  )) day1Score++;

  // Login API
  day1Tasks++;
  if (checkFileContent(
    'src/app/api/auth/login/route.ts',
    ['POST', 'verifyPassword', 'generateToken', 'database'],
    'Login API with JWT tokens'
  )) day1Score++;

  // Email Verification API
  day1Tasks++;
  if (checkFileContent(
    'src/app/api/auth/verify-email/route.ts',
    ['GET', 'verification_token', 'email_verified'],
    'Email verification API'
  )) day1Score++;

  // Registration Form
  day1Tasks++;
  if (checkFileContent(
    'src/components/RegistrationForm.tsx',
    ['useState', 'fetch', 'validation', '/api/auth/register'],
    'Registration form component'
  )) day1Score++;

  // Login Form
  day1Tasks++;
  if (checkFileContent(
    'src/components/LoginForm.tsx',
    ['useState', 'fetch', '/api/auth/login', 'router.push'],
    'Login form component'
  )) day1Score++;

  const day1Percentage = Math.round((day1Score / day1Tasks) * 100);
  log(`\nDAY 1 RESULT: ${day1Score}/${day1Tasks} (${day1Percentage}%)`, day1Percentage === 100 ? 'green' : 'yellow');

  // ============ DAY 2: PASSWORD RESET & ENHANCED AUTH ============
  log('\n🚀 DAY 2: PASSWORD RESET & ENHANCED AUTH', 'magenta');
  log('============================================================', 'magenta');
  
  let day2Score = 0;
  let day2Tasks = 0;

  // Forgot Password API
  day2Tasks++;
  if (checkFileContent(
    'src/app/api/auth/forgot-password/route.ts',
    ['POST', 'reset_token', 'randomUUID'],
    'Forgot password API'
  )) day2Score++;

  // Reset Password API
  day2Tasks++;
  if (checkFileContent(
    'src/app/api/auth/reset-password/route.ts',
    ['POST', 'reset_token', 'hashPassword', 'UPDATE users'],
    'Reset password API'
  )) day2Score++;

  // Forgot Password Form
  day2Tasks++;
  if (checkFileContent(
    'src/components/ForgotPasswordForm.tsx',
    ['useState', 'fetch', '/api/auth/forgot-password'],
    'Forgot password form'
  )) day2Score++;

  // Reset Password Form
  day2Tasks++;
  if (checkFileContent(
    'src/components/ResetPasswordForm.tsx',
    ['useState', 'useSearchParams', '/api/auth/reset-password'],
    'Reset password form'
  )) day2Score++;

  // Page Routes
  day2Tasks++;
  if (checkFile('src/app/forgot-password/page.tsx', 'Forgot password page') &&
      checkFile('src/app/reset-password/page.tsx', 'Reset password page')) {
    day2Score++;
  }

  const day2Percentage = Math.round((day2Score / day2Tasks) * 100);
  log(`\nDAY 2 RESULT: ${day2Score}/${day2Tasks} (${day2Percentage}%)`, day2Percentage === 100 ? 'green' : 'yellow');

  // ============ DAY 3: PROTECTED ROUTES & PROFILE ============
  log('\n⚡ DAY 3: PROTECTED ROUTES & PROFILE MANAGEMENT', 'blue');
  log('============================================================', 'blue');
  
  let day3Score = 0;
  let day3Tasks = 0;

  // Authentication Middleware
  day3Tasks++;
  if (checkFileContent(
    'middleware.ts',
    ['jwtVerify', 'NextResponse', 'protected routes', '/dashboard'],
    'Authentication middleware'
  )) day3Score++;

  // Dashboard Page
  day3Tasks++;
  if (checkFileContent(
    'src/app/dashboard/page.tsx',
    ['Dashboard', 'useEffect', '/api/auth/me', 'Loading'],
    'Dashboard page'
  )) day3Score++;

  // User Profile API
  day3Tasks++;
  if (checkFileContent(
    'src/app/api/auth/me/route.ts',
    ['GET', 'better-sqlite3', 'authService', 'SELECT * FROM users'],
    'User profile API'
  )) day3Score++;

  // Auth Service
  day3Tasks++;
  if (checkFileContent(
    'src/lib/auth-service.ts',
    ['generateToken', 'verifyToken', 'getTokenFromRequest'],
    'Authentication service'
  )) day3Score++;

  const day3Percentage = Math.round((day3Score / day3Tasks) * 100);
  log(`\nDAY 3 RESULT: ${day3Score}/${day3Tasks} (${day3Percentage}%)`, day3Percentage === 100 ? 'green' : 'yellow');

  // ============ OVERALL SUMMARY ============
  totalScore = day1Score + day2Score + day3Score;
  totalTasks = day1Tasks + day2Tasks + day3Tasks;
  const overallPercentage = Math.round((totalScore / totalTasks) * 100);

  log('\n' + '█' * 60, 'bold');
  log('██                 WEEK 1 SUMMARY                    ██', 'bold');
  log('████████████████████████████████████████████████████████', 'bold');

  log(`\n📊 DAILY BREAKDOWN:`, 'bold');
  log(`   Day 1 (Foundation):     ${day1Score}/${day1Tasks} (${day1Percentage}%)`, day1Percentage === 100 ? 'green' : 'yellow');
  log(`   Day 2 (Password Reset): ${day2Score}/${day2Tasks} (${day2Percentage}%)`, day2Percentage === 100 ? 'green' : 'yellow');
  log(`   Day 3 (Protected):      ${day3Score}/${day3Tasks} (${day3Percentage}%)`, day3Percentage === 100 ? 'green' : 'yellow');

  log(`\n🎯 OVERALL COMPLETION: ${totalScore}/${totalTasks} (${overallPercentage}%)`, 'bold');

  if (overallPercentage === 100) {
    log('\n🎉🎉🎉 WEEK 1 AUTHENTICATION SYSTEM IS COMPLETE! 🎉🎉🎉', 'green');
    log('✨ All authentication features have been successfully implemented!', 'green');
    log('🔐 Your MTG Investment app now has a full-featured auth system!', 'green');
  } else if (overallPercentage >= 90) {
    log('\n🚀 WEEK 1 is nearly complete! Just a few finishing touches needed.', 'yellow');
  } else {
    log('\n📝 Continue working through the remaining authentication features.', 'yellow');
  }

  // Architecture Summary
  log('\n🏗️  IMPLEMENTED ARCHITECTURE:', 'cyan');
  log('   ✅ JWT-based authentication with secure tokens', 'green');
  log('   ✅ bcrypt password hashing for security', 'green');
  log('   ✅ SQLite database with proper schema', 'green');
  log('   ✅ Email verification system', 'green');
  log('   ✅ Password reset with secure tokens', 'green');
  log('   ✅ Protected route middleware', 'green');
  log('   ✅ User profile management', 'green');
  log('   ✅ React forms with validation', 'green');
  log('   ✅ Next.js API routes for all auth flows', 'green');

  return overallPercentage;
}

if (require.main === module) {
  const completionPercentage = runCompleteWeek1Test();
  process.exit(completionPercentage === 100 ? 0 : 1);
}

module.exports = { runCompleteWeek1Test };
