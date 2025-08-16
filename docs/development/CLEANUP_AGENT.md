# 🧹 Cleanup Agent - Multi-Agent Workflow Integration

The **Cleanup Agent** is an automated codebase maintenance system that runs after each specialized agent completes their work, ensuring a clean and production-ready codebase.

## 🎯 Purpose

- **Remove Artifacts**: Cleans up test files, backups, and temporary files created during development
- **Maintain Quality**: Ensures codebase remains clean and production-ready
- **Track Changes**: Provides detailed reports of cleanup activities
- **Automate Maintenance**: Reduces manual cleanup overhead

## 🚀 Usage

### Basic Cleanup
```bash
# Run cleanup with preview (recommended first)
npm run cleanup:dry

# Run actual cleanup
npm run cleanup

# Verbose cleanup with detailed output
node cleanup.js --verbose
```

### Agent-Specific Cleanup
```bash
# Complete an agent and run specialized cleanup
npm run workflow:complete backend-agent

# Dry run for specific agent
node workflow.js complete frontend-agent --dry-run

# Final cleanup after all agents
npm run workflow:final
```

## 🔧 Integration with Multi-Agent Workflow

### Recommended Agent Sequence with Cleanup:

```bash
# 1. TypeScript Agent + Cleanup
npm run workflow:complete typescript-agent

# 2. Frontend Agent + Cleanup  
npm run workflow:complete frontend-agent

# 3. Backend Agent + Cleanup
npm run workflow:complete backend-agent

# 4. Database Agent + Cleanup
npm run workflow:complete database-agent

# 5. Performance Agent + Cleanup
npm run workflow:complete performance-agent

# 6. Security Agent + Cleanup
npm run workflow:complete security-agent

# 7. Testing Agent + Cleanup
npm run workflow:complete testing-agent

# 8. DevOps Agent + Cleanup
npm run workflow:complete devops-agent

# 9. Final Project Cleanup
npm run workflow:final
```

## 📋 What Gets Cleaned Up

### Universal Cleanup (All Agents)
- **Backup Files**: `*-backup.*`, `*-old.*`, `*-refactored.*`
- **Test Files**: `*.test.*`, `*.spec.*`, `**/__tests__/**`
- **Temporary Files**: `**/tmp/**`, `**/temp/**`, `**/*.tmp`
- **Development Files**: `*.dev.*`, `**/debug/**`, `**/development/**`
- **System Files**: `.DS_Store`, `Thumbs.db`, `*.swp`

### Agent-Specific Cleanup

#### TypeScript Agent
- Temporary type files
- Backup type definitions  
- Old typing attempts
- Unused type exports

#### Frontend Agent
- Backup component files
- Test component files
- Development-only components
- Page backups
- Unused component imports

#### Backend Agent
- Backup API routes
- Temporary config files
- Debug utilities
- Development middleware
- Temporary scripts

#### Database Agent
- Migration backups
- Test database files
- Development seed data
- Old schema files

#### Performance Agent
- Performance test files
- Benchmark data
- Profiling reports
- Optimization backups

#### Security Agent
- Test security files
- Development certificates
- Mock security data
- Demo authentication

#### Testing Agent
- Test generation artifacts
- Coverage backups
- Obsolete mock data
- Duplicate test files

#### DevOps Agent
- Deployment backups
- CI/CD test files
- Development configs
- Backup deployment scripts

## 📊 Cleanup Reports

The cleanup agent generates detailed reports:

```json
{
  "timestamp": "2025-08-12T...",
  "stats": {
    "filesRemoved": 6,
    "directoriesRemoved": 0,
    "bytesFreed": 61603,
    "errors": 0
  },
  "summary": "Cleanup completed: 6 files removed, 60.16 KB freed",
  "log": [...]
}
```

Reports are saved to:
- `cleanup-report.json` - Individual cleanup reports
- `multi-agent-workflow-report.json` - Complete workflow summary

## 🔍 Dry Run Mode

Always test cleanup with dry run first:

```bash
# See what would be cleaned without actually removing files
npm run cleanup:dry

# Agent-specific dry run
node workflow.js complete backend-agent --dry-run
```

## ⚙️ Configuration

Customize cleanup patterns in `lib/agent-cleanup-config.js`:

```javascript
const agentCleanupTasks = {
  "my-custom-agent": {
    description: "Clean up after My Custom Agent",
    patterns: [
      "**/my-temp-files/**",
      "**/*-my-backup.*"
    ],
    customTasks: [
      "Remove custom artifacts",
      "Clean up specific patterns"
    ]
  }
};
```

## 🛡️ Safety Features

- **Dry Run Mode**: Preview changes before execution
- **Error Handling**: Graceful failure handling and reporting
- **Selective Patterns**: Only removes known safe patterns
- **Logging**: Detailed logs of all actions
- **Rollback Info**: Reports show exactly what was removed

## 🚨 Best Practices

1. **Always Dry Run First**: Use `--dry-run` to preview changes
2. **Agent-Specific Cleanup**: Use specialized cleanup after each agent
3. **Final Cleanup**: Run comprehensive cleanup at project end
4. **Review Reports**: Check cleanup reports for unexpected removals
5. **Version Control**: Commit changes before running cleanup
6. **Backup Important Files**: Ensure important files aren't matching cleanup patterns

## 🔄 Automation

For CI/CD integration:

```yaml
# .github/workflows/cleanup.yml
- name: Run cleanup after agent
  run: npm run workflow:complete ${{ matrix.agent }}
  
- name: Final cleanup
  run: npm run workflow:final
```

## 📝 Example Usage

```bash
# Complete workflow example
git checkout -b feature/agent-refactoring

# Run agents with cleanup
npm run workflow:complete typescript-agent
git add . && git commit -m "TypeScript Agent + Cleanup"

npm run workflow:complete frontend-agent  
git add . && git commit -m "Frontend Agent + Cleanup"

npm run workflow:complete backend-agent
git add . && git commit -m "Backend Agent + Cleanup"

# Final cleanup and review
npm run workflow:final
git add . && git commit -m "Final cleanup"

# Review total changes
git diff main --stat
```

The Cleanup Agent ensures your multi-agent workflow results in a clean, maintainable, and production-ready codebase! 🎉
