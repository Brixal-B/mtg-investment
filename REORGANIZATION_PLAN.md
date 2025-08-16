# MTG Investment Directory Reorganization Plan

## Current Issues
- Root directory has 50+ files and folders
- Documentation scattered between root and docs/
- Scripts mixed with source code
- Test files in multiple locations
- Development artifacts not properly organized

## Proposed Structure

```
mtg-investment/
├── .github/                     # GitHub workflows and templates
├── .next/                       # Next.js build cache (keep)
├── node_modules/               # Dependencies (keep)
├── public/                     # Static assets (create if needed)
├── src/                        # Source code (already organized)
├── data/                       # Database files (keep)
├── scripts/                    # Administrative scripts (reorganize)
│   ├── database/              # Database-related scripts
│   ├── deployment/            # Deployment scripts
│   ├── development/           # Development utilities
│   └── maintenance/           # Maintenance scripts
├── docs/                       # All documentation (reorganize)
│   ├── development/           # Development guides
│   ├── deployment/            # Deployment guides
│   ├── architecture/          # System architecture docs
│   ├── progress/              # Progress reports
│   └── agents/                # AI agent documentation
├── tests/                      # Test files and utilities
│   ├── fixtures/              # Test data files
│   ├── e2e/                   # End-to-end tests
│   ├── integration/           # Integration tests
│   └── unit/                  # Unit tests
├── tools/                      # Development tools and utilities
│   ├── cleanup/               # Cleanup tools
│   ├── analysis/              # Code analysis tools
│   └── validation/            # Validation scripts
├── temp/                       # Temporary files (git-ignored)
├── config/                     # Configuration files
│   ├── jest.config.js
│   ├── playwright.config.ts
│   ├── tailwind.config.js
│   ├── eslint.config.mjs
│   └── next.config.js
└── [root files]               # Only essential root files
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── README.md
    ├── .gitignore
    ├── .env.example
    └── Dockerfile
```

## Files to Move/Organize

### Move to docs/progress/
- BRANCH_STRUCTURE_COMPLETE.md
- CHANGELOG.md
- CHANGE_REVIEW_SUMMARY.md
- COMPREHENSIVE_CODE_REVIEW.md
- CSV_*.md files
- EXECUTIVE_SUMMARY.md
- PHASE_*.md files
- TESTING_*.md files
- All weekly progress files

### Move to config/
- eslint.config.mjs
- eslint.test.config.js
- jest.config.js
- playwright.config.ts
- postcss.config.js
- tailwind.config.js

### Move to tools/
- check-dates.js
- comprehensive-review.js
- debug-csv.js
- review-changes.js
- test-optimization-summary.js
- testing-implementation-summary.js

### Move to tests/fixtures/
- sample-cardsphere-export.csv
- test-cards-simple.csv
- test-cards.csv

### Delete (obsolete/duplicate)
- package-temp.json
- simple-check.js (root level - duplicate of scripts/simple-check.js)
- Various .js files that are duplicated in scripts/

## Benefits
1. Clean root directory with only essential files
2. Logical grouping of related files
3. Clear separation of concerns
4. Easier navigation and maintenance
5. Better for new developers joining the project
