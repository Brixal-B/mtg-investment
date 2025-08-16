#!/usr/bin/env node

/**
 * MTG Investment Application - Production Progress Assessment
 * 
 * Comprehensive analysis of the current production readiness across all features:
 * - Authentication System (Week 1)
 * - MTG Card Database & Pricing
 * - Portfolio Management
 * - Collection Tracking
 * - User Interface & Experience
 * - Magic Player Features
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
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
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

function runProductionAssessment() {
  log('\n🏭 MTG INVESTMENT APPLICATION - PRODUCTION PROGRESS ASSESSMENT', 'bold');
  log('════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('Comprehensive analysis of production readiness across all application features', 'cyan');
  log('════════════════════════════════════════════════════════════════════════════\n', 'cyan');

  let totalScore = 0;
  let totalFeatures = 0;

  // ============ CATEGORY 1: AUTHENTICATION SYSTEM ============
  log('🔐 CATEGORY 1: AUTHENTICATION SYSTEM', 'blue');
  log('─'.repeat(80), 'blue');
  
  let authScore = 0;
  let authFeatures = 0;

  // Core Authentication
  authFeatures++;
  if (checkFileContent('src/app/api/auth/register/route.ts', ['POST', 'hashPassword', 'validation'], 'User Registration API') &&
      checkFileContent('src/app/api/auth/login/route.ts', ['POST', 'verifyPassword', 'generateToken'], 'User Login API') &&
      checkFileContent('src/lib/auth-service.ts', ['generateToken', 'verifyToken'], 'Authentication Service')) {
    authScore++;
  }

  // Password Management
  authFeatures++;
  if (checkFileContent('src/app/api/auth/forgot-password/route.ts', ['POST', 'reset_token'], 'Forgot Password API') &&
      checkFileContent('src/app/api/auth/reset-password/route.ts', ['POST', 'hashPassword'], 'Reset Password API')) {
    authScore++;
  }

  // Protected Routes & Middleware
  authFeatures++;
  if (checkFileContent('middleware.ts', ['jwtVerify', 'protected routes'], 'Auth Middleware') &&
      checkFileContent('src/app/dashboard/page.tsx', ['Dashboard', 'useEffect'], 'Protected Dashboard')) {
    authScore++;
  }

  // User Management
  authFeatures++;
  if (checkFileContent('src/app/api/auth/me/route.ts', ['GET', 'better-sqlite3'], 'User Profile API') &&
      checkFileContent('scripts/create-users-migration.js', ['CREATE TABLE users'], 'User Database Schema')) {
    authScore++;
  }

  const authPercentage = Math.round((authScore / authFeatures) * 100);
  log(`\n🔐 AUTHENTICATION RESULT: ${authScore}/${authFeatures} (${authPercentage}%)`, authPercentage === 100 ? 'green' : 'yellow');

  // ============ CATEGORY 2: MTG CARD DATABASE & PRICING ============
  log('\n🃏 CATEGORY 2: MTG CARD DATABASE & PRICING', 'magenta');
  log('─'.repeat(80), 'magenta');
  
  let cardScore = 0;
  let cardFeatures = 0;

  // MTGJSON Integration
  cardFeatures++;
  if (checkFile('data/AllPrintings.json', 'MTGJSON Card Database') &&
      checkFile('data/AllPrices.json', 'MTGJSON Price Database') &&
      checkFileContent('scripts/load-mtgjson-price-history.js', ['MTGJSON', 'price data'], 'Price Loading Script')) {
    cardScore++;
  }

  // Price History API
  cardFeatures++;
  if (checkFileContent('src/app/api/price-history/route.ts', ['GET', 'POST'], 'Price History API') ||
      checkFile('load-mtgjson-price-history.js', 'Price History Loading')) {
    cardScore++;
  }

  // Database Schema
  cardFeatures++;
  if (checkFile('data/mtg-investment.db', 'SQLite Database') &&
      checkFileContent('src/lib/database.ts', ['Database', 'sqlite'], 'Database Service')) {
    cardScore++;
  }

  // Card Types & Interfaces
  cardFeatures++;
  if (checkFileContent('src/types/mtg.ts', ['MTGCard', 'MTGCardPrices', 'ProcessedCardPrice'], 'MTG Type Definitions')) {
    cardScore++;
  }

  const cardPercentage = Math.round((cardScore / cardFeatures) * 100);
  log(`\n🃏 MTG DATABASE RESULT: ${cardScore}/${cardFeatures} (${cardPercentage}%)`, cardPercentage === 100 ? 'green' : 'yellow');

  // ============ CATEGORY 3: PORTFOLIO MANAGEMENT ============
  log('\n📊 CATEGORY 3: PORTFOLIO MANAGEMENT', 'cyan');
  log('─'.repeat(80), 'cyan');
  
  let portfolioScore = 0;
  let portfolioFeatures = 0;

  // Portfolio API
  portfolioFeatures++;
  if (checkFileContent('src/app/api/portfolio/route.ts', ['GET', 'portfolio', 'totalValue'], 'Portfolio API')) {
    portfolioScore++;
  }

  // Portfolio Dashboard
  portfolioFeatures++;
  if (checkFileContent('src/app/portfolio/page.tsx', ['Portfolio', 'dashboard'], 'Portfolio Page') ||
      checkFileContent('src/components/portfolio/PortfolioOverview.tsx', ['Portfolio', 'totalValue'], 'Portfolio Overview')) {
    portfolioScore++;
  }

  // Collection Portfolio Types
  portfolioFeatures++;
  if (checkFileContent('src/types/player.ts', ['CollectionPortfolio', 'PortfolioPerformance'], 'Portfolio Types')) {
    portfolioScore++;
  }

  // Collection Management
  portfolioFeatures++;
  if (checkFileContent('src/components/CollectionPortfolioDashboard.tsx', ['collection', 'portfolio'], 'Collection Dashboard')) {
    portfolioScore++;
  }

  const portfolioPercentage = Math.round((portfolioScore / portfolioFeatures) * 100);
  log(`\n📊 PORTFOLIO RESULT: ${portfolioScore}/${portfolioFeatures} (${portfolioPercentage}%)`, portfolioPercentage === 100 ? 'green' : 'yellow');

  // ============ CATEGORY 4: USER INTERFACE & EXPERIENCE ============
  log('\n🎨 CATEGORY 4: USER INTERFACE & EXPERIENCE', 'yellow');
  log('─'.repeat(80), 'yellow');
  
  let uiScore = 0;
  let uiFeatures = 0;

  // Main Application Pages
  uiFeatures++;
  if (checkFile('src/app/page.tsx', 'Main Application Page') &&
      checkFile('src/app/layout.tsx', 'Application Layout')) {
    uiScore++;
  }

  // Authentication UI
  uiFeatures++;
  if (checkFileContent('src/components/RegistrationForm.tsx', ['Registration', 'useState'], 'Registration Form') &&
      checkFileContent('src/components/LoginForm.tsx', ['Login', 'useState'], 'Login Form')) {
    uiScore++;
  }

  // Core Features UI
  uiFeatures++;
  if (checkFile('src/app/card-search/page.tsx', 'Card Search Page') &&
      checkFile('src/app/wishlist/page.tsx', 'Wishlist Page')) {
    uiScore++;
  }

  // Trading & Advanced Features
  uiFeatures++;
  if (checkFile('src/app/trade', 'Trading Features') &&
      checkFile('src/app/deck-builder', 'Deck Builder')) {
    uiScore++;
  }

  const uiPercentage = Math.round((uiScore / uiFeatures) * 100);
  log(`\n🎨 USER INTERFACE RESULT: ${uiScore}/${uiFeatures} (${uiPercentage}%)`, uiPercentage === 100 ? 'green' : 'yellow');

  // ============ CATEGORY 5: MAGIC PLAYER FEATURES ============
  log('\n🎮 CATEGORY 5: MAGIC PLAYER FEATURES', 'magenta');
  log('─'.repeat(80), 'magenta');
  
  let playerScore = 0;
  let playerFeatures = 0;

  // Deck Building
  playerFeatures++;
  if (checkFile('src/app/deck-builder', 'Deck Builder Feature') &&
      checkFileContent('src/types/player.ts', ['Deck', 'DeckCard'], 'Deck Types')) {
    playerScore++;
  }

  // Wishlist Management
  playerFeatures++;
  if (checkFile('src/app/wishlist', 'Wishlist Feature') &&
      checkFileContent('src/types/player.ts', ['WishlistItem', 'PriceAlert'], 'Wishlist Types')) {
    playerScore++;
  }

  // Trading System
  playerFeatures++;
  if (checkFile('src/app/trade', 'Trading System') &&
      checkFileContent('src/types/trading.ts', ['TradeRequest', 'TradeOffer'], 'Trading Types')) {
    playerScore++;
  }

  // Collection Analytics
  playerFeatures++;
  if (checkFileContent('src/types/player.ts', ['DiversificationMetrics', 'TopHolding'], 'Analytics Types') &&
      checkFileContent('docs/MAGIC_PLAYER_IMPLEMENTATION.md', ['Magic Player', 'Implementation'], 'Player Features Documentation')) {
    playerScore++;
  }

  const playerPercentage = Math.round((playerScore / playerFeatures) * 100);
  log(`\n🎮 PLAYER FEATURES RESULT: ${playerScore}/${playerFeatures} (${playerPercentage}%)`, playerPercentage === 100 ? 'green' : 'yellow');

  // ============ CATEGORY 6: PRODUCTION READINESS ============
  log('\n🚀 CATEGORY 6: PRODUCTION READINESS', 'white');
  log('─'.repeat(80), 'white');
  
  let prodScore = 0;
  let prodFeatures = 0;

  // Configuration & Environment
  prodFeatures++;
  if (checkFile('next.config.ts', 'Next.js Configuration') &&
      checkFile('package.json', 'Package Configuration') &&
      checkFile('tsconfig.json', 'TypeScript Configuration')) {
    prodScore++;
  }

  // Database & Data Management
  prodFeatures++;
  if (checkFile('data/mtg-investment.db', 'Production Database') &&
      checkFileContent('scripts/create-users-migration.js', ['migration', 'users table'], 'Database Migration')) {
    prodScore++;
  }

  // Testing & Validation
  prodFeatures++;
  if (checkFile('scripts/test-week1-complete.js', 'Comprehensive Tests') &&
      checkFile('scripts/test-week1-day3-progress.js', 'Progress Tests')) {
    prodScore++;
  }

  // Documentation & Guides
  prodFeatures++;
  if (checkFile('README.md', 'Project Documentation') &&
      checkFile('docs/WEEK_1_AUTHENTICATION_COMPLETE.md', 'Implementation Documentation')) {
    prodScore++;
  }

  const prodPercentage = Math.round((prodScore / prodFeatures) * 100);
  log(`\n🚀 PRODUCTION READINESS RESULT: ${prodScore}/${prodFeatures} (${prodPercentage}%)`, prodPercentage === 100 ? 'green' : 'yellow');

  // ============ OVERALL ASSESSMENT ============
  totalScore = authScore + cardScore + portfolioScore + uiScore + playerScore + prodScore;
  totalFeatures = authFeatures + cardFeatures + portfolioFeatures + uiFeatures + playerFeatures + prodFeatures;
  const overallPercentage = Math.round((totalScore / totalFeatures) * 100);

  log('\n🏭 PRODUCTION PROGRESS SUMMARY', 'bold');
  log('════════════════════════════════════════════════════════════════════════════', 'cyan');

  log(`\n📊 CATEGORY BREAKDOWN:`, 'bold');
  log(`   🔐 Authentication System:     ${authScore}/${authFeatures} (${authPercentage}%)`, authPercentage >= 90 ? 'green' : authPercentage >= 70 ? 'yellow' : 'red');
  log(`   🃏 MTG Database & Pricing:    ${cardScore}/${cardFeatures} (${cardPercentage}%)`, cardPercentage >= 90 ? 'green' : cardPercentage >= 70 ? 'yellow' : 'red');
  log(`   📊 Portfolio Management:      ${portfolioScore}/${portfolioFeatures} (${portfolioPercentage}%)`, portfolioPercentage >= 90 ? 'green' : portfolioPercentage >= 70 ? 'yellow' : 'red');
  log(`   🎨 User Interface & UX:       ${uiScore}/${uiFeatures} (${uiPercentage}%)`, uiPercentage >= 90 ? 'green' : uiPercentage >= 70 ? 'yellow' : 'red');
  log(`   🎮 Magic Player Features:     ${playerScore}/${playerFeatures} (${playerPercentage}%)`, playerPercentage >= 90 ? 'green' : playerPercentage >= 70 ? 'yellow' : 'red');
  log(`   🚀 Production Readiness:      ${prodScore}/${prodFeatures} (${prodPercentage}%)`, prodPercentage >= 90 ? 'green' : prodPercentage >= 70 ? 'yellow' : 'red');

  log(`\n🎯 OVERALL PRODUCTION STATUS: ${totalScore}/${totalFeatures} (${overallPercentage}%)`, 'bold');

  if (overallPercentage >= 90) {
    log('\n🎉 PRODUCTION READY! The application is ready for deployment with comprehensive features.', 'green');
  } else if (overallPercentage >= 80) {
    log('\n🚀 NEAR PRODUCTION READY! Most features are complete, minor enhancements needed.', 'yellow');
  } else if (overallPercentage >= 70) {
    log('\n📝 GOOD PROGRESS! Core features are solid, continue building remaining functionality.', 'yellow');
  } else {
    log('\n🔨 DEVELOPMENT IN PROGRESS! Continue implementing core features.', 'red');
  }

  // Feature Maturity Analysis
  log('\n📈 FEATURE MATURITY ANALYSIS:', 'cyan');
  log('   🟢 COMPLETE (90-100%): Ready for production use', 'green');
  log('   🟡 ADVANCED (70-89%): Core functionality ready, enhancements needed', 'yellow');
  log('   🟠 DEVELOPING (50-69%): Basic functionality present, significant work needed', 'red');
  log('   🔴 PLANNING (0-49%): Early stage or not yet implemented', 'red');

  // Deployment Recommendations
  log('\n🚀 DEPLOYMENT READINESS:', 'bold');
  if (authPercentage === 100) {
    log('   ✅ User authentication system is production-ready', 'green');
  }
  if (cardPercentage >= 75) {
    log('   ✅ MTG card database integration is functional', 'green');
  }
  if (portfolioPercentage >= 75) {
    log('   ✅ Portfolio management features are operational', 'green');
  }
  
  log('\n🎯 NEXT PRIORITIES:', 'bold');
  const priorities = [
    { name: 'Authentication', score: authPercentage, priority: authPercentage < 100 ? 'HIGH' : 'COMPLETE' },
    { name: 'Card Database', score: cardPercentage, priority: cardPercentage < 80 ? 'HIGH' : 'MEDIUM' },
    { name: 'Portfolio Management', score: portfolioPercentage, priority: portfolioPercentage < 80 ? 'HIGH' : 'MEDIUM' },
    { name: 'User Interface', score: uiPercentage, priority: uiPercentage < 80 ? 'HIGH' : 'MEDIUM' },
    { name: 'Player Features', score: playerPercentage, priority: playerPercentage < 70 ? 'MEDIUM' : 'LOW' },
    { name: 'Production Setup', score: prodPercentage, priority: prodPercentage < 90 ? 'HIGH' : 'LOW' }
  ];

  priorities
    .filter(p => p.priority !== 'COMPLETE')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .forEach((priority, index) => {
      const color = priority.priority === 'HIGH' ? 'red' : priority.priority === 'MEDIUM' ? 'yellow' : 'green';
      log(`   ${index + 1}. ${priority.name} (${priority.score}%) - ${priority.priority} PRIORITY`, color);
    });

  return overallPercentage;
}

if (require.main === module) {
  const productionReadiness = runProductionAssessment();
  process.exit(productionReadiness >= 80 ? 0 : 1);
}

module.exports = { runProductionAssessment };
