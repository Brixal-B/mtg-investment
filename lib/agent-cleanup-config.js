/**
 * 🧹 Post-Agent Cleanup Configuration
 * 
 * Defines specific cleanup tasks for each agent type
 */

const agentCleanupTasks = {
  "typescript-agent": {
    description: "Clean up after TypeScript/Types Agent",
    patterns: [
      // Remove any temporary type files
      "**/types/*-temp.*",
      "**/types/*-backup.*",
      "**/types/test-*.*",
      // Remove old type definition attempts
      "**/*.d.ts.bak",
      "**/typings-backup/**"
    ],
    customTasks: [
      "Consolidate duplicate type exports",
      "Remove unused type definitions",
      "Clean up import/export organization"
    ]
  },

  "frontend-agent": {
    description: "Clean up after Frontend Architecture Agent", 
    patterns: [
      // Remove backup component files
      "**/components/*-backup.*",
      "**/components/*-old.*",
      "**/components/*-refactored.*",
      // Remove test component files
      "**/components/Test*.*",
      "**/components/*-test.*",
      // Remove page backups
      "**/page-backup.*",
      "**/page-old.*",
      "**/page-refactored.*",
      // Remove development components
      "**/components/Dev*.*",
      "**/components/Debug*.*"
    ],
    customTasks: [
      "Remove unused component imports",
      "Clean up commented-out JSX",
      "Remove development-only components",
      "Consolidate similar components"
    ]
  },

  "backend-agent": {
    description: "Clean up after Backend API Agent",
    patterns: [
      // Remove backup API routes
      "**/api/**/*-backup.*",
      "**/api/**/*-old.*", 
      "**/api/**/*-original.*",
      // Remove temporary config files
      "**/lib/*-temp.*",
      "**/lib/*-test.*",
      // Remove debug utilities
      "**/utils/debug-*.*",
      "**/lib/debug-*.*",
      // Remove temporary scripts
      "**/scripts/temp-*.*",
      "**/scripts/*-backup.*"
    ],
    customTasks: [
      "Remove hardcoded debug endpoints",
      "Clean up temporary logging statements",
      "Remove development-only middleware",
      "Consolidate utility functions"
    ]
  },

  "database-agent": {
    description: "Clean up after Database Agent",
    patterns: [
      // Remove migration backup files
      "**/migrations/*-backup.*",
      "**/migrations/test-*.*",
      // Remove old schema files
      "**/schema/*-old.*",
      "**/schema/backup-*.*",
      // Remove database test files
      "**/db/test-*.*",
      "**/db/*-backup.*",
      // Remove seed data backups
      "**/seeds/*-backup.*",
      "**/seeds/dev-*.*"
    ],
    customTasks: [
      "Remove test database connections",
      "Clean up development seed data",
      "Remove migration rollback files",
      "Consolidate database utilities"
    ]
  },

  "performance-agent": {
    description: "Clean up after Performance Agent",
    patterns: [
      // Remove performance test files
      "**/perf-*.*",
      "**/benchmark-*.*",
      "**/profile-*.*",
      // Remove optimization backup files
      "**/optimized/*-backup.*",
      "**/cache/*-test.*",
      // Remove development profiling
      "**/profiling/**",
      "**/lighthouse-reports/**"
    ],
    customTasks: [
      "Remove development profiling code",
      "Clean up performance measurement logs",
      "Remove test optimization configurations",
      "Consolidate caching strategies"
    ]
  },

  "security-agent": {
    description: "Clean up after Security Agent",
    patterns: [
      // Remove test security files
      "**/auth/test-*.*",
      "**/security/*-backup.*",
      // Remove development certificates
      "**/certs/dev-*.*",
      "**/ssl/test-*.*",
      // Remove security test data
      "**/security/mock-*.*",
      "**/auth/demo-*.*"
    ],
    customTasks: [
      "Remove test authentication data",
      "Clean up development security logs",
      "Remove mock security implementations",
      "Validate production security configs"
    ]
  },

  "testing-agent": {
    description: "Clean up after Testing Agent",
    patterns: [
      // This agent creates test files, so minimal cleanup
      "**/test-backup/**",
      "**/coverage-backup/**",
      // Remove test generation artifacts
      "**/test-gen/**",
      "**/mock-backup/**"
    ],
    customTasks: [
      "Remove duplicate test files",
      "Clean up test generation artifacts",
      "Organize test directory structure",
      "Remove obsolete mock data"
    ]
  },

  "devops-agent": {
    description: "Clean up after DevOps Agent",
    patterns: [
      // Remove deployment backup files
      "**/.docker/*-backup.*",
      "**/docker/*-old.*",
      // Remove CI/CD test files
      "**/.github/workflows/*-test.*",
      "**/.github/workflows/*-backup.*",
      // Remove deployment artifacts
      "**/deploy/*-backup.*",
      "**/scripts/deploy-*-backup.*"
    ],
    customTasks: [
      "Remove development deployment configs",
      "Clean up CI/CD test artifacts",
      "Remove backup deployment scripts",
      "Consolidate environment configurations"
    ]
  }
};

/**
 * Universal cleanup patterns applied after any agent
 */
const universalCleanup = {
  patterns: [
    // Version control artifacts
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.swp",
    "**/*.swo",
    "**/.*~",
    
    // Editor artifacts
    "**/.vscode-backup/**",
    "**/*.code-workspace.bak",
    
    // Build artifacts
    "**/dist-backup/**",
    "**/build-backup/**",
    "**/.next-backup/**",
    
    // Dependency artifacts
    "**/node_modules-backup/**",
    "**/package-lock-backup.json",
    
    // Log files
    "**/npm-debug.log*",
    "**/yarn-debug.log*",
    "**/yarn-error.log*",
    "**/debug.log",
    "**/error.log",
    
    // OS artifacts
    "**/*.tmp",
    "**/tmp-*.*",
    "**/.temp/**"
  ],
  
  customTasks: [
    "Remove empty directories",
    "Clean up broken symlinks", 
    "Remove orphaned configuration files",
    "Consolidate similar utility functions",
    "Remove commented-out code blocks",
    "Clean up unused imports",
    "Remove debug console.log statements"
  ]
};

export { agentCleanupTasks, universalCleanup };
