#!/usr/bin/env node

/**
 * Environment Setup Script for MTG Investment Tracking
 * This script helps set up environment variables for different environments
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_FILES = {
  development: '.env.local',
  production: '.env.production', 
  test: '.env.test',
  example: '.env.example'
};

/**
 * Generate a secure JWT secret
 */
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Check if environment file exists
 */
function checkEnvFile(environment) {
  const filePath = path.join(process.cwd(), ENV_FILES[environment]);
  return fs.existsSync(filePath);
}

/**
 * Create environment file from template
 */
function createEnvFromTemplate(environment) {
  const sourceFile = ENV_FILES.example;
  const targetFile = ENV_FILES[environment];
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Template file ${sourceFile} not found!`);
    return false;
  }
  
  let content = fs.readFileSync(sourceFile, 'utf8');
  
  // Replace placeholders based on environment
  if (environment === 'development') {
    content = content.replace(
      'your-super-secure-jwt-secret-here',
      'dev-jwt-secret-for-mtg-investment-application-12345678'
    );
  } else if (environment === 'production') {
    const jwtSecret = generateJWTSecret();
    content = content.replace(
      'your-super-secure-jwt-secret-here',
      jwtSecret
    );
    console.log(`🔐 Generated secure JWT secret for production`);
  }
  
  fs.writeFileSync(targetFile, content);
  console.log(`✅ Created ${targetFile} from template`);
  return true;
}

/**
 * Validate existing environment file
 */
function validateEnvFile(environment) {
  const filePath = ENV_FILES[environment];
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Environment file ${filePath} does not exist`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  
  // Check for required variables
  if (!content.includes('JWT_SECRET=') || content.includes('your-super-secure-jwt-secret-here')) {
    errors.push('JWT_SECRET is missing or using default value');
  }
  
  if (!content.includes('DATABASE_URL=')) {
    errors.push('DATABASE_URL is missing');
  }
  
  if (environment === 'production') {
    if (content.includes('dev-jwt-secret') || content.includes('localhost')) {
      errors.push('Production environment contains development values');
    }
  }
  
  if (errors.length > 0) {
    console.log(`❌ Validation errors for ${filePath}:`);
    errors.forEach(error => console.log(`   - ${error}`));
    return false;
  }
  
  console.log(`✅ ${filePath} is valid`);
  return true;
}

/**
 * Main setup function
 */
function setupEnvironment() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  
  console.log('🛠️  MTG Investment - Environment Setup\n');
  
  switch (command) {
    case 'init':
      console.log(`Initializing ${environment} environment...`);
      if (checkEnvFile(environment)) {
        console.log(`⚠️  ${ENV_FILES[environment]} already exists`);
        console.log(`Use 'npm run env:validate ${environment}' to check it`);
      } else {
        createEnvFromTemplate(environment);
      }
      break;
      
    case 'validate':
      console.log(`Validating ${environment} environment...`);
      validateEnvFile(environment);
      break;
      
    case 'generate-secret':
      console.log('🔐 Generated JWT Secret:');
      console.log(generateJWTSecret());
      console.log('\n⚠️  Store this securely and add it to your environment file');
      break;
      
    case 'status':
      console.log('Environment Status:');
      Object.keys(ENV_FILES).forEach(env => {
        const exists = checkEnvFile(env);
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${ENV_FILES[env]} ${exists ? 'exists' : 'missing'}`);
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/setup-env.js init [environment]     - Create environment file');
      console.log('  node scripts/setup-env.js validate [environment] - Validate environment file');
      console.log('  node scripts/setup-env.js generate-secret        - Generate JWT secret');
      console.log('  node scripts/setup-env.js status                 - Show environment status');
      console.log('');
      console.log('Environments: development, production, test');
      console.log('');
      console.log('Examples:');
      console.log('  npm run env:init development');
      console.log('  npm run env:validate production');
      console.log('  npm run env:secret');
      break;
  }
}

// Run the setup
setupEnvironment();
