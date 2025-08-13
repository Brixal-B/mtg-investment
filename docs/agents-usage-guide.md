# MTG Investment - Agents Usage Guide

## Overview

The MTG Investment project includes a sophisticated multi-agent cleanup system designed to maintain code quality and project structure. This system provides automated cleanup after various development activities.

## Available Agents

### 1. **typescript-agent**
Handles TypeScript-related cleanup after type system refactoring.

**Cleanup patterns:**
- Temporary type files (`**/types/*-temp.*`)
- Backup type definitions (`**/*.d.ts.bak`)
- Test type files (`**/types/test-*.*`)

**Usage:**
```bash
node workflow.js complete typescript-agent --dry-run
node workflow.js complete typescript-agent --verbose
```

### 2. **frontend-agent**
Cleans up after frontend component and page refactoring.

**Cleanup patterns:**
- Backup component files (`**/components/*-backup.*`)
- Test components (`**/components/Test*.*`)
- Development components (`**/components/Dev*.*`)
- Page backups (`**/page-backup.*`)

**Usage:**
```bash
node workflow.js complete frontend-agent --dry-run
node workflow.js complete frontend-agent --verbose
```

### 3. **backend-agent**
Handles cleanup after API and backend service changes.

**Cleanup patterns:**
- Backup API routes (`**/api/**/*-backup.*`)
- Temporary config files (`**/lib/*-temp.*`)
- Debug utilities (`**/utils/debug-*.*`)
- Temporary scripts (`**/scripts/temp-*.*`)

**Usage:**
```bash
node workflow.js complete backend-agent --dry-run
node workflow.js complete backend-agent --verbose
```

### 4. **database-agent**
Cleans up after database schema and migration changes.

**Cleanup patterns:**
- Migration backups (`**/migrations/*-backup.*`)
- Test database files (`**/db/test-*.*`)
- Development seed data (`**/seeds/dev-*.*`)
- Schema backups (`**/schema/*-old.*`)

**Usage:**
```bash
node workflow.js complete database-agent --dry-run
node workflow.js complete database-agent --verbose
```

### 5. **performance-agent**
Handles cleanup after performance optimization work.

**Cleanup patterns:**
- Performance test files (`**/perf-*.*`)
- Benchmark data (`**/benchmark-*.*`)
- Profiling reports (`**/profiling/**`)
- Optimization backups (`**/optimized/*-backup.*`)

**Usage:**
```bash
node workflow.js complete performance-agent --dry-run
node workflow.js complete performance-agent --verbose
```

### 6. **security-agent**
Cleans up after security implementations and audits.

**Cleanup patterns:**
- Test security files (`**/auth/test-*.*`)
- Development certificates (`**/certs/dev-*.*`)
- Mock security data (`**/security/mock-*.*`)
- Demo authentication (`**/auth/demo-*.*`)

**Usage:**
```bash
node workflow.js complete security-agent --dry-run
node workflow.js complete security-agent --verbose
```

### 7. **testing-agent**
Handles cleanup after test infrastructure changes.

**Cleanup patterns:**
- Test generation artifacts (`**/test-gen/**`)
- Coverage backups (`**/coverage-backup/**`)
- Mock backups (`**/mock-backup/**`)

**Usage:**
```bash
node workflow.js complete testing-agent --dry-run
node workflow.js complete testing-agent --verbose
```

### 8. **devops-agent**
Cleans up after deployment and CI/CD changes.

**Cleanup patterns:**
- Docker backups (`**/.docker/*-backup.*`)
- CI/CD test files (`**/.github/workflows/*-test.*`)
- Deployment backups (`**/deploy/*-backup.*`)
- Old deployment scripts (`**/scripts/deploy-*-backup.*`)

**Usage:**
```bash
node workflow.js complete devops-agent --dry-run
node workflow.js complete devops-agent --verbose
```

## Universal Cleanup

All agents also perform universal cleanup that removes:
- Version control artifacts (`.DS_Store`, `Thumbs.db`)
- Editor artifacts (`.vscode-backup/**`)
- Build artifacts (`**/dist-backup/**`)
- Log files (`**/npm-debug.log*`)
- Temporary files (`**/*.tmp`)

## Command Reference

### Basic Cleanup
```bash
# Run standalone cleanup
node cleanup.js --dry-run --verbose
node cleanup.js --verbose
node cleanup.js
```

### Agent-Specific Cleanup
```bash
# Complete an agent and run specialized cleanup
node workflow.js complete <agent-type> [options]

# Available options:
#   --dry-run, -d     Preview changes without deleting
#   --verbose, -v     Show detailed output
```

### Final Project Cleanup
```bash
# Run comprehensive final cleanup
node workflow.js final --dry-run
node workflow.js final --verbose
node workflow.js final
```

## Example Workflows

### Complete Development Cycle
```bash
# 1. TypeScript refactoring
node workflow.js complete typescript-agent

# 2. Frontend component updates  
node workflow.js complete frontend-agent

# 3. Backend API changes
node workflow.js complete backend-agent

# 4. Database migrations
node workflow.js complete database-agent

# 5. Performance optimizations
node workflow.js complete performance-agent

# 6. Security implementations
node workflow.js complete security-agent

# 7. Test infrastructure
node workflow.js complete testing-agent

# 8. Deployment updates
node workflow.js complete devops-agent

# 9. Final project cleanup
node workflow.js final
```

### Preview Mode Workflow
```bash
# Always preview first
node workflow.js complete frontend-agent --dry-run
# If satisfied with preview, run actual cleanup
node workflow.js complete frontend-agent
```

## Reports and Logging

### Individual Agent Reports
Each agent completion generates a cleanup report:
- `cleanup-report.json` - Individual cleanup statistics

### Workflow Summary
Final cleanup generates a comprehensive workflow report:
- `multi-agent-workflow-report.json` - Complete workflow summary

### Report Contents
```json
{
  "timestamp": "2025-01-13T...",
  "stats": {
    "filesRemoved": 15,
    "directoriesRemoved": 3,
    "bytesFreed": 1048576,
    "errors": 0
  },
  "summary": "Cleanup completed: 15 files and 3 directories removed, 1.00 MB freed"
}
```

## Best Practices

### 1. Always Preview First
```bash
# Use --dry-run to preview changes
node workflow.js complete frontend-agent --dry-run
```

### 2. Use Verbose Mode for Debugging
```bash
# See exactly what's being cleaned
node workflow.js complete backend-agent --verbose
```

### 3. Review Reports
Check generated reports to understand what was cleaned up.

### 4. Commit Before Cleanup
Ensure your work is committed before running cleanup operations.

### 5. Test After Cleanup
Run tests and builds after cleanup to ensure nothing important was removed.

## Troubleshooting

### Agent Not Found
If you get "No specific cleanup configuration for agent", ensure you're using one of the supported agent types.

### Files Not Being Cleaned
1. Check if files match the cleanup patterns
2. Ensure files aren't in ignored directories (`node_modules`, `.git`, `.next`)
3. Use `--verbose` mode to see what's being processed

### Errors During Cleanup
1. Check file permissions
2. Ensure files aren't in use
3. Review the cleanup report for specific error details

## Safety Features

- **Dry Run Mode**: Preview changes before execution
- **Pattern-Based**: Only removes files matching known safe patterns  
- **Detailed Logging**: Complete audit trail of all actions
- **Error Handling**: Graceful failure with detailed error reporting
- **Selective Cleanup**: Agent-specific patterns prevent over-cleaning

## Configuration

Agent cleanup patterns can be customized in `lib/agent-cleanup-config.js`:

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

This system ensures your MTG Investment codebase remains clean and production-ready while providing full transparency and control over the cleanup process.