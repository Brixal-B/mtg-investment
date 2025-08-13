#!/usr/bin/env node

/**
 * 🗄️ Database Migration Script
 * 
 * Executes the Database Agent to migrate from file-based storage to SQLite
 * 
 * Usage:
 *   node migrate-to-database.js [--dry-run] [--verbose]
 */

const DatabaseAgent = require('./lib/database-agent');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🗄️ MTG Investment Database Migration');
  console.log('=====================================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual changes will be made');
  }

  try {
    const agent = new DatabaseAgent({
      dryRun,
      verbose,
      workspaceRoot: process.cwd()
    });

    console.log('\n🚀 Starting Database Agent execution...\n');

    const results = await agent.execute();

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   Tables created: ${results.tablesCreated}`);
    console.log(`   Records migrated: ${results.recordsMigrated}`);
    console.log(`   Files replaced: ${results.filesReplaced}`);
    console.log(`   Errors: ${results.errors}`);

    if (results.errors === 0) {
      console.log('\n✅ Migration completed without errors');
      console.log('💡 Your application now uses SQLite for data storage');
      console.log('🔧 Updated API routes are ready to use the new database');
    } else {
      console.log(`\n⚠️  Migration completed with ${results.errors} errors`);
      console.log('📋 Check the migration report for details');
    }

    // Cleanup
    await agent.cleanup();

  } catch (error) {
    console.error('\n❌ Database migration failed:');
    console.error(error.message);
    
    if (verbose) {
      console.error('\nFull error details:');
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
