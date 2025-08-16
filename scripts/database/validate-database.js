#!/usr/bin/env node

/**
 * Database Validation Script
 * 
 * Performs comprehensive validation and constraint checking on the MTG Investment database
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database configuration
const dbPath = path.join(__dirname, '../data/mtg-investment.db');

async function validateDatabase() {
  console.log('🔍 MTG Investment Database Validation');
  console.log('===================================');
  
  const validationResults = {
    cardValidation: { passed: 0, failed: 0, issues: [] },
    priceValidation: { passed: 0, failed: 0, issues: [] },
    foreignKeyValidation: { passed: 0, failed: 0, issues: [] },
    dataIntegrity: { passed: 0, failed: 0, issues: [] }
  };

  try {
    // Initialize database connection
    const db = new sqlite3.Database(dbPath);
    console.log('✅ Database connection established');

    // Helper to promisify db methods
    const dbAll = (query, params = []) => new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 1. Validate card data
    console.log('\n📋 Validating card data...');
    const cards = await dbAll('SELECT * FROM cards');
    
    for (const card of cards) {
      if (!card.uuid || !card.name) {
        validationResults.cardValidation.failed++;
        validationResults.cardValidation.issues.push(`Card missing required fields: ${JSON.stringify(card)}`);
      } else {
        validationResults.cardValidation.passed++;
      }
    }

    // 2. Validate price data
    console.log('\n💰 Validating price history data...');
    const priceRecords = await dbAll('SELECT * FROM price_history');
    
    for (const price of priceRecords) {
      let issues = [];
      
      if (!price.card_uuid) issues.push('missing card_uuid');
      if (!price.date) issues.push('missing date');
      if (!price.source) issues.push('missing source');
      if (price.price_usd && (typeof price.price_usd !== 'number' || price.price_usd <= 0)) {
        issues.push('invalid price_usd');
      }
      
      if (issues.length > 0) {
        validationResults.priceValidation.failed++;
        validationResults.priceValidation.issues.push(`Price record ${price.id}: ${issues.join(', ')}`);
      } else {
        validationResults.priceValidation.passed++;
      }
    }

    // 3. Validate foreign key constraints
    console.log('\n🔗 Validating foreign key constraints...');
    const orphanedPrices = await dbAll(`
      SELECT ph.* FROM price_history ph
      LEFT JOIN cards c ON ph.card_uuid = c.uuid
      WHERE c.uuid IS NULL
    `);
    
    if (orphanedPrices.length > 0) {
      validationResults.foreignKeyValidation.failed = orphanedPrices.length;
      validationResults.foreignKeyValidation.issues.push(`Found ${orphanedPrices.length} orphaned price records`);
    } else {
      validationResults.foreignKeyValidation.passed = priceRecords.length;
    }

    // 4. Data integrity checks
    console.log('\n🛡️ Checking data integrity...');
    
    // Check for duplicate price records
    const duplicates = await dbAll(`
      SELECT card_uuid, date, source, COUNT(*) as count
      FROM price_history
      GROUP BY card_uuid, date, source
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      validationResults.dataIntegrity.failed += duplicates.length;
      validationResults.dataIntegrity.issues.push(`Found ${duplicates.length} duplicate price records`);
    }
    
    // Check for invalid dates
    const invalidDates = await dbAll(`
      SELECT * FROM price_history
      WHERE date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    `);
    
    if (invalidDates.length > 0) {
      validationResults.dataIntegrity.failed += invalidDates.length;
      validationResults.dataIntegrity.issues.push(`Found ${invalidDates.length} records with invalid date format`);
    }
    
    if (validationResults.dataIntegrity.failed === 0) {
      validationResults.dataIntegrity.passed = priceRecords.length;
    }

    // Close database connection
    db.close();

    // Display results
    console.log('\n📊 Validation Results');
    console.log('===================');
    
    const categories = ['cardValidation', 'priceValidation', 'foreignKeyValidation', 'dataIntegrity'];
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of categories) {
      const result = validationResults[category];
      const status = result.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category}: ${result.passed} passed, ${result.failed} failed`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    }
    
    console.log('\n🎯 Summary');
    console.log(`Total validations: ${totalPassed + totalFailed}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All validations passed! Database integrity is excellent.');
    } else {
      console.log('\n⚠️ Some validations failed. Please review the issues above.');
    }

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateDatabase().catch(console.error);
}

module.exports = { validateDatabase };