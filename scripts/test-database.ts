#!/usr/bin/env npx tsx

/**
 * Database setup and testing CLI
 * Usage: npx tsx scripts/test-database.ts [command]
 * Commands: init, health, reset, test
 */

import { initializeDatabase, checkDatabaseHealth, resetDatabase } from '../src/lib/database-init';
import { CardModel, PriceHistoryModel, CardSetModel } from '../src/lib/database/models';
import db from '../src/lib/database/connection';

async function main() {
  const command = process.argv[2] || 'health';

  try {
    switch (command) {
      case 'init':
        console.log('🚀 Initializing database...');
        const initResult = await initializeDatabase();
        console.log('✅ Database initialized:', initResult);
        break;

      case 'health':
        console.log('🔍 Checking database health...');
        const healthResult = await checkDatabaseHealth();
        console.log('📊 Database health:', healthResult);
        break;

      case 'reset':
        console.log('⚠️  Resetting database...');
        await resetDatabase();
        console.log('✅ Database reset complete');
        break;

      case 'test':
        console.log('🧪 Running database tests...');
        await runDatabaseTests();
        console.log('✅ Database tests complete');
        break;

      default:
        console.log('❌ Unknown command:', command);
        console.log('Available commands: init, health, reset, test');
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function runDatabaseTests() {
  console.log('Testing card creation...');
  
  // Ensure database is connected
  const { initializeDatabase } = await import('../src/lib/database-init');
  await initializeDatabase();
  
  // Test card set creation first (due to foreign key constraint)
  console.log('Creating test card set...');
  await CardSetModel.create({
    code: 'TST',
    name: 'Test Set',
    type: 'core'
  });
  console.log('✅ Card set created');
  
  // Test card creation
  const testCard = {
    uuid: 'test-uuid-123',
    name: 'Test Card',
    setCode: 'TST',
    setName: 'Test Set',
    rarity: 'common',
    typeLine: 'Creature — Human',
    manaCost: '{1}{U}',
    cmc: 2,
    oracleText: 'This is a test card.'
  };

  await CardModel.create(testCard);
  console.log('✅ Card created');

  // Test card retrieval
  const retrievedCard = await CardModel.findByUuid(testCard.uuid);
  console.log('✅ Card retrieved:', retrievedCard?.name);

  // Test price history
  await PriceHistoryModel.addPrice(testCard.uuid, new Date(), 1.50);
  console.log('✅ Price added');

  const currentPrice = await PriceHistoryModel.getCurrentPrice(testCard.uuid);
  console.log('✅ Current price retrieved:', currentPrice);

  // Test search
  const searchResults = await CardModel.search({ search: 'Test' });
  console.log('✅ Search completed, found cards:', searchResults.cards.length);

  // Clean up test data (order matters due to foreign keys)
  await PriceHistoryModel.deletePriceHistory(testCard.uuid);
  // Need to delete the card before deleting the set due to foreign key constraint
  await db.query('DELETE FROM cards WHERE uuid = ?', [testCard.uuid]);
  await CardSetModel.delete(testCard.setCode);
  console.log('✅ Test data cleaned up');
}

main().catch(console.error);