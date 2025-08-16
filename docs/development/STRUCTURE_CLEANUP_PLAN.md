# 🧹 App Structure Cleanup Plan

## 📋 Current Issues Identified

### **Root Directory Clutter** 
- Legacy standalone scripts mixed with config files
- MTGJSON data files in root (should be in data/)
- Multiple report files scattered
- Debug files and temporary artifacts

### **Scripts Organization**
- Standalone scripts that could be organized into `/scripts` directory
- Agent-related files that could be consolidated  

## 🎯 Cleanup Actions

### **1. Organize Standalone Scripts**
Move all utility scripts to a dedicated `/scripts` directory:
- `check-dates.js` → `/scripts/check-dates.js`
- `cleanup.js` → `/scripts/cleanup.js`
- `download-mtgjson.js` → `/scripts/download-mtgjson.js`
- `import-mtgjson-to-sqlite.js` → `/scripts/import-mtgjson-to-sqlite.js`
- `load-mtgjson-price-history.js` → `/scripts/load-mtgjson-price-history.js`
- `migrate-to-database.js` → `/scripts/migrate-to-database.js`
- `simple-check.js` → `/scripts/simple-check.js`
- `workflow.js` → `/scripts/workflow.js`

### **2. Consolidate Reports**
Move all report files to `/docs/reports/`:
- `cleanup-report.json` → `/docs/reports/cleanup-report.json`
- `database-migration-report.json` → `/docs/reports/database-migration-report.json`
- `devops-agent-report.json` → `/docs/reports/devops-agent-report.json`
- `performance-optimization-report.json` → `/docs/reports/performance-optimization-report.json`
- `security-implementation-report.json` → `/docs/reports/security-implementation-report.json`
- `testing-agent-report.json` → `/docs/reports/testing-agent-report.json`
- `multi-agent-workflow-report.json` → `/docs/reports/multi-agent-workflow-report.json`

### **3. Move Large Data Files**
- `AllPrices.json` → `/data/AllPrices.json` (if not already moved)
- `AllPrintings.json` → `/data/AllPrintings.json` (if not already moved)

### **4. Clean Debug Files**
- Remove `--debug`, `debug` (temporary debugging artifacts)
- Clean up any other temporary files

### **5. Organize Lib Directory**
- Keep agent files in `/lib` as they're part of the infrastructure
- Ensure proper organization of utilities vs agents

## ✅ Final Structure
```
/workspaces/mtg-investment-next/
├── .github/                 # GitHub configurations
├── .next/                   # Next.js build artifacts
├── data/                    # Application data files
├── docs/                    # Documentation
│   ├── agents/              # Agent documentation
│   ├── architecture/        # Architecture docs
│   └── reports/            # All system reports
├── lib/                     # Agent infrastructure & utilities
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── src/                     # Application source code
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Application utilities
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── test-results/            # Test output
├── package.json             # Dependencies
├── next.config.ts           # Next.js config
├── tailwind.config.js       # Tailwind config
├── tsconfig.json            # TypeScript config
└── README.md                # Project documentation
```

This organization follows Next.js best practices while maintaining the multi-agent infrastructure that's been built.
