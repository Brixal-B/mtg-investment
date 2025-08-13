#!/usr/bin/env node

/**
 * 🤖 Multi-Agent Workflow with Integrated Cleanup
 * 
 * This script orchestrates the agent workflow with automatic cleanup after each agent
 */

const CleanupAgent = require('./lib/cleanup-agent');
const { agentCleanupTasks, universalCleanup } = require('./lib/agent-cleanup-config');

class MultiAgentWorkflow {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.workspaceRoot = process.cwd();
    this.completedAgents = [];
  }

  /**
   * Register an agent as completed and run cleanup
   */
  async completeAgent(agentType, customCleanupPatterns = []) {
    console.log(`\n🤖 Agent "${agentType}" completed. Running cleanup...`);
    
    // Get cleanup configuration for this agent
    const agentConfig = agentCleanupTasks[agentType];
    if (!agentConfig) {
      console.log(`⚠️  No specific cleanup configuration for agent: ${agentType}`);
      console.log(`🧹 Running universal cleanup instead...`);
    }

    // Combine cleanup patterns
    const patterns = [
      ...(agentConfig?.patterns || []),
      ...customCleanupPatterns,
      ...universalCleanup.patterns
    ];

    // Create specialized cleanup agent for this agent type
    const cleanup = new SpecializedCleanupAgent({
      dryRun: this.dryRun,
      verbose: this.verbose,
      workspaceRoot: this.workspaceRoot,
      agentType,
      patterns
    });

    const results = await cleanup.execute();
    
    // Track completed agent
    this.completedAgents.push({
      agentType,
      completedAt: new Date().toISOString(),
      cleanupResults: results
    });

    console.log(`✅ Agent "${agentType}" cleanup complete!`);
    return results;
  }

  /**
   * Run final cleanup after all agents complete
   */
  async finalCleanup() {
    console.log('\n🏁 Running final project cleanup...');
    
    const cleanup = new CleanupAgent({
      dryRun: this.dryRun,
      verbose: this.verbose,
      workspaceRoot: this.workspaceRoot
    });

    const results = await cleanup.execute();
    
    // Generate workflow summary
    this.generateWorkflowSummary(results);
    
    return results;
  }

  /**
   * Generate complete workflow summary
   */
  generateWorkflowSummary(finalResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      completedAgents: this.completedAgents,
      finalCleanup: finalResults,
      totalStats: this.calculateTotalStats()
    };

    const reportPath = `${this.workspaceRoot}/multi-agent-workflow-report.json`;
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

    console.log('\n📊 Multi-Agent Workflow Summary:');
    console.log(`   Agents completed: ${this.completedAgents.length}`);
    console.log(`   Total files removed: ${summary.totalStats.filesRemoved}`);
    console.log(`   Total disk space freed: ${this.formatBytes(summary.totalStats.bytesFreed)}`);
    console.log(`   Workflow report: ${reportPath}`);
  }

  /**
   * Calculate total statistics across all cleanup phases
   */
  calculateTotalStats() {
    return this.completedAgents.reduce((total, agent) => {
      const stats = agent.cleanupResults;
      return {
        filesRemoved: total.filesRemoved + stats.filesRemoved,
        directoriesRemoved: total.directoriesRemoved + stats.directoriesRemoved,
        bytesFreed: total.bytesFreed + stats.bytesFreed,
        errors: total.errors + stats.errors
      };
    }, { filesRemoved: 0, directoriesRemoved: 0, bytesFreed: 0, errors: 0 });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Specialized cleanup agent for specific agent types
 */
class SpecializedCleanupAgent extends CleanupAgent {
  constructor(options) {
    super(options);
    this.agentType = options.agentType;
    this.patterns = options.patterns || [];
  }

  async execute() {
    console.log(`🧹 Specialized cleanup for: ${this.agentType}`);
    
    // Run cleanup with agent-specific patterns
    await this.removeByPatterns(this.patterns, `${this.agentType} artifacts`);
    
    // Run standard cleanup tasks
    await this.removeEmptyDirectories();
    
    // Generate report
    this.generateReport();
    
    return this.stats;
  }
}

// CLI Interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 Multi-Agent Workflow with Cleanup

Usage: 
  node workflow.js complete <agent-type> [options]    Complete an agent and run cleanup
  node workflow.js final [options]                    Run final cleanup
  node workflow.js --help                             Show this help

Agent Types:
  typescript-agent, frontend-agent, backend-agent, database-agent,
  performance-agent, security-agent, testing-agent, devops-agent

Options:
  --dry-run, -d     Show what would be removed without actually deleting
  --verbose, -v     Show detailed output

Examples:
  node workflow.js complete frontend-agent --dry-run
  node workflow.js complete backend-agent --verbose
  node workflow.js final
`);
  process.exit(0);
}

// Main execution
async function main() {
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const workflow = new MultiAgentWorkflow(options);

  if (args[0] === 'complete' && args[1]) {
    const agentType = args[1];
    await workflow.completeAgent(agentType);
  } else if (args[0] === 'final') {
    await workflow.finalCleanup();
  } else {
    console.log('Invalid command. Use --help for usage information.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MultiAgentWorkflow, SpecializedCleanupAgent };
