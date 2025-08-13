#!/usr/bin/env node

/**
 * 🤖 Multi-Agent Workflow Example
 * 
 * This script demonstrates how to use the agent system for different development scenarios
 */

import { MultiAgentWorkflow } from './workflow.js';

class AgentDemoRunner {
  constructor() {
    this.dryRun = true; // Always use dry run for demo
    this.verbose = true;
  }

  async runDemo() {
    console.log('🚀 MTG Investment - Multi-Agent Workflow Demo\n');

    const workflow = new MultiAgentWorkflow({
      dryRun: this.dryRun,
      verbose: this.verbose
    });

    // Scenario 1: TypeScript Refactoring
    console.log('📝 Scenario 1: TypeScript Type System Refactoring');
    console.log('   - Updated MTG card type definitions');
    console.log('   - Refactored price interface types');
    console.log('   - Running TypeScript Agent cleanup...\n');
    
    await workflow.completeAgent('typescript-agent');
    console.log('\n' + '='.repeat(60) + '\n');

    // Scenario 2: Frontend Component Updates
    console.log('🎨 Scenario 2: Frontend Component Architecture');
    console.log('   - Refactored card grid components');
    console.log('   - Updated admin panel layout');
    console.log('   - Improved responsive design');
    console.log('   - Running Frontend Agent cleanup...\n');
    
    await workflow.completeAgent('frontend-agent');
    console.log('\n' + '='.repeat(60) + '\n');

    // Scenario 3: Backend API Development
    console.log('🔧 Scenario 3: Backend API Enhancement');
    console.log('   - Added new price history endpoints');
    console.log('   - Implemented card search API');
    console.log('   - Updated authentication middleware');
    console.log('   - Running Backend Agent cleanup...\n');
    
    await workflow.completeAgent('backend-agent');
    console.log('\n' + '='.repeat(60) + '\n');

    // Scenario 4: Database Schema Updates
    console.log('🗄️ Scenario 4: Database Schema Migration');
    console.log('   - Added new price tracking tables');
    console.log('   - Updated card metadata schema');
    console.log('   - Implemented data validation');
    console.log('   - Running Database Agent cleanup...\n');
    
    await workflow.completeAgent('database-agent');
    console.log('\n' + '='.repeat(60) + '\n');

    // Scenario 5: Performance Optimization
    console.log('⚡ Scenario 5: Performance Optimization');
    console.log('   - Optimized card data loading');
    console.log('   - Implemented caching strategies');
    console.log('   - Added lazy loading for images');
    console.log('   - Running Performance Agent cleanup...\n');
    
    await workflow.completeAgent('performance-agent');
    console.log('\n' + '='.repeat(60) + '\n');

    // Final cleanup
    console.log('🏁 Final Project Cleanup');
    console.log('   - Removing any remaining artifacts');
    console.log('   - Generating workflow summary');
    console.log('   - Running Final cleanup...\n');
    
    await workflow.finalCleanup();
    console.log('\n' + '='.repeat(60) + '\n');

    // Demo summary
    this.showDemoSummary();
  }

  showDemoSummary() {
    console.log('📊 Demo Summary:');
    console.log('');
    console.log('✅ Demonstrated 5 different agent types:');
    console.log('   • TypeScript Agent - Type system cleanup');
    console.log('   • Frontend Agent - Component and UI cleanup');
    console.log('   • Backend Agent - API and service cleanup');
    console.log('   • Database Agent - Schema and migration cleanup');
    console.log('   • Performance Agent - Optimization cleanup');
    console.log('');
    console.log('✅ Showed workflow progression:');
    console.log('   • Individual agent completion');
    console.log('   • Specialized cleanup patterns');
    console.log('   • Final comprehensive cleanup');
    console.log('   • Report generation');
    console.log('');
    console.log('💡 Key Features Demonstrated:');
    console.log('   • Dry-run mode for safe previewing');
    console.log('   • Verbose logging for transparency');
    console.log('   • Agent-specific cleanup patterns');
    console.log('   • Workflow tracking and reporting');
    console.log('   • Error handling and graceful degradation');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('   • Remove --dry-run flag for actual cleanup');
    console.log('   • Customize cleanup patterns for your needs');
    console.log('   • Integrate into your development workflow');
    console.log('   • Review generated reports for insights');
    console.log('');
    console.log('📚 For more information:');
    console.log('   • docs/agents-usage-guide.md - Complete usage guide');
    console.log('   • CLEANUP_AGENT.md - Detailed documentation');
    console.log('   • lib/agent-cleanup-config.js - Configuration options');
  }
}

// Available demo scenarios
const scenarios = {
  'full': 'Complete multi-agent workflow demonstration',
  'single': 'Single agent demonstration',
  'patterns': 'Show cleanup patterns for each agent',
  'help': 'Show this help message'
};

function showHelp() {
  console.log('🤖 MTG Investment - Agent Demo\n');
  console.log('Usage: node agent-demo.js [scenario]\n');
  console.log('Available scenarios:');
  Object.entries(scenarios).forEach(([key, desc]) => {
    console.log(`  ${key.padEnd(10)} ${desc}`);
  });
  console.log('\nExamples:');
  console.log('  node agent-demo.js full      # Run complete demo');
  console.log('  node agent-demo.js single    # Demo single agent');
  console.log('  node agent-demo.js patterns  # Show cleanup patterns');
  console.log('  node agent-demo.js help      # Show this help');
}

async function runSingleAgentDemo() {
  console.log('🎯 Single Agent Demo - TypeScript Agent\n');
  
  const workflow = new MultiAgentWorkflow({
    dryRun: true,
    verbose: true
  });

  console.log('Simulating TypeScript refactoring work...');
  console.log('Running TypeScript Agent cleanup...\n');
  
  await workflow.completeAgent('typescript-agent');
  
  console.log('\n✅ Single agent demo complete!');
  console.log('💡 Try other agents: frontend-agent, backend-agent, etc.');
}

async function showCleanupPatterns() {
  const { agentCleanupTasks } = await import('./lib/agent-cleanup-config.js');
  
  console.log('🧹 Agent Cleanup Patterns\n');
  
  Object.entries(agentCleanupTasks).forEach(([agentType, config]) => {
    console.log(`📋 ${agentType.toUpperCase()}`);
    console.log(`   Description: ${config.description}`);
    console.log('   Cleanup Patterns:');
    config.patterns.forEach(pattern => {
      console.log(`     • ${pattern}`);
    });
    console.log('   Custom Tasks:');
    config.customTasks.forEach(task => {
      console.log(`     • ${task}`);
    });
    console.log('');
  });
}

// Main execution
async function main() {
  const scenario = process.argv[2] || 'help';

  try {
    switch (scenario) {
      case 'full':
        const demo = new AgentDemoRunner();
        await demo.runDemo();
        break;
      case 'single':
        await runSingleAgentDemo();
        break;
      case 'patterns':
        await showCleanupPatterns();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run main function
main();