#!/usr/bin/env node

/**
 * 🧹 Cleanup Agent CLI
 * Usage: node cleanup.js [options]
 */

const CleanupAgent = require('../lib/cleanup-agent');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  workspaceRoot: process.cwd()
};

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧹 Cleanup Agent - Automated Codebase Maintenance

Usage: node cleanup.js [options]

Options:
  --dry-run, -d     Show what would be removed without actually deleting
  --verbose, -v     Show detailed output
  --help, -h        Show this help message

Examples:
  node cleanup.js --dry-run     # Preview cleanup actions
  node cleanup.js --verbose     # Run cleanup with detailed output
  node cleanup.js               # Run cleanup silently
`);
  process.exit(0);
}

// Run cleanup agent
async function main() {
  try {
    console.log('🧹 Starting Cleanup Agent...\n');
    
    const agent = new CleanupAgent(options);
    const results = await agent.execute();
    
    console.log('\n🎉 Cleanup completed successfully!');
    
    if (options.dryRun) {
      console.log('\n💡 This was a dry run. Use without --dry-run to actually remove files.');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();
