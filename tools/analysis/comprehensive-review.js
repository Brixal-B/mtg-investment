#!/usr/bin/env node

/**
 * 🔍 Comprehensive Code Review Agent
 * 
 * This agent performs a thorough analysis of the MTG Investment codebase
 * across multiple dimensions: architecture, security, performance, 
 * maintainability, and best practices.
 */

const fs = require('fs');
const path = require('path');

class CodeReviewAgent {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.findings = {
      architecture: [],
      security: [],
      performance: [],
      maintainability: [],
      bestPractices: [],
      bugs: [],
      improvements: []
    };
    this.metrics = {
      totalFiles: 0,
      linesOfCode: 0,
      components: 0,
      apiEndpoints: 0,
      testCoverage: 0
    };
  }

  async performReview() {
    console.log('🔍 Starting Comprehensive Code Review...\n');
    
    await this.analyzeProjectStructure();
    await this.reviewComponents();
    await this.reviewApiEndpoints();
    await this.reviewDatabaseLayer();
    await this.reviewSecurity();
    await this.reviewPerformance();
    await this.reviewMaintainability();
    await this.analyzeTestCoverage();
    await this.checkBestPractices();
    
    this.generateReport();
  }

  async analyzeProjectStructure() {
    console.log('📁 Analyzing Project Structure...');
    
    const structure = {
      src: this.analyzeDirectory('src'),
      docs: this.analyzeDirectory('docs'),
      scripts: this.analyzeDirectory('scripts'),
      lib: this.analyzeDirectory('lib'),
      data: this.analyzeDirectory('data')
    };
    
    console.log(`   📊 Total directories analyzed: ${Object.keys(structure).length}`);
    console.log(`   📄 Total files found: ${this.metrics.totalFiles}`);
    
    // Check for proper Next.js structure
    const hasAppDir = fs.existsSync(path.join(this.workspaceRoot, 'src/app'));
    const hasComponents = fs.existsSync(path.join(this.workspaceRoot, 'src/components'));
    const hasLib = fs.existsSync(path.join(this.workspaceRoot, 'src/lib'));
    
    console.log(`   ✅ App directory (Next.js 13+): ${hasAppDir ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Components directory: ${hasComponents ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Lib directory: ${hasLib ? 'Present' : 'Missing'}`);
    
    if (!hasAppDir) {
      this.findings.architecture.push({
        type: 'warning',
        message: 'Missing src/app directory - ensure Next.js 13+ structure is followed'
      });
    }
    
    console.log('');
  }

  analyzeDirectory(dirName) {
    const dirPath = path.join(this.workspaceRoot, dirName);
    if (!fs.existsSync(dirPath)) return { exists: false };
    
    const files = this.getFilesRecursively(dirPath);
    this.metrics.totalFiles += files.length;
    
    return {
      exists: true,
      fileCount: files.length,
      files: files.map(f => path.relative(this.workspaceRoot, f))
    };
  }

  getFilesRecursively(dir) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getFilesRecursively(fullPath));
        } else if (stat.isFile() && !item.startsWith('.')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    return files;
  }

  async reviewComponents() {
    console.log('⚛️ Reviewing React Components...');
    
    const componentsDir = path.join(this.workspaceRoot, 'src/components');
    if (!fs.existsSync(componentsDir)) {
      console.log('   ❌ Components directory not found');
      return;
    }
    
    const componentFiles = this.getFilesRecursively(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'));
    
    this.metrics.components = componentFiles.length;
    console.log(`   📊 Found ${componentFiles.length} React components`);
    
    // Analyze key components
    const keyComponents = [
      'CSVCollectionUpload.tsx',
      'CollectionPortfolioDashboard.tsx',
      'AddCardModal.tsx',
      'LoginForm.tsx'
    ];
    
    for (const comp of keyComponents) {
      const compPath = componentFiles.find(f => f.includes(comp));
      if (compPath) {
        await this.analyzeComponent(compPath, comp);
      } else {
        console.log(`   ❌ Key component missing: ${comp}`);
        this.findings.architecture.push({
          type: 'error',
          message: `Missing key component: ${comp}`
        });
      }
    }
    
    console.log('');
  }

  async analyzeComponent(filePath, componentName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      this.metrics.linesOfCode += lines;
      
      console.log(`   ✅ ${componentName}: ${lines} lines`);
      
      // Check for best practices
      const checks = {
        hasTypeScript: content.includes('interface ') || content.includes('type '),
        hasErrorHandling: content.includes('try') && content.includes('catch'),
        hasProperImports: content.includes('import React'),
        hasDefaultExport: content.includes('export default'),
        hasPropsInterface: content.includes('Props') && content.includes('interface'),
        usesHooks: content.includes('useState') || content.includes('useEffect'),
        hasComments: content.includes('//') || content.includes('/*')
      };
      
      Object.entries(checks).forEach(([check, passed]) => {
        if (!passed && check === 'hasErrorHandling') {
          this.findings.bestPractices.push({
            type: 'warning',
            component: componentName,
            message: `Consider adding error handling to ${componentName}`
          });
        }
        if (!passed && check === 'hasPropsInterface') {
          this.findings.bestPractices.push({
            type: 'info',
            component: componentName,
            message: `Consider defining Props interface for ${componentName}`
          });
        }
      });
      
      // Check component size
      if (lines > 500) {
        this.findings.maintainability.push({
          type: 'warning',
          component: componentName,
          message: `Large component (${lines} lines) - consider splitting into smaller components`
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error analyzing ${componentName}: ${error.message}`);
    }
  }

  async reviewApiEndpoints() {
    console.log('🔗 Reviewing API Endpoints...');
    
    const apiDir = path.join(this.workspaceRoot, 'src/app/api');
    if (!fs.existsSync(apiDir)) {
      console.log('   ❌ API directory not found');
      return;
    }
    
    const apiFiles = this.getFilesRecursively(apiDir)
      .filter(file => file.endsWith('route.ts') || file.endsWith('route.js'));
    
    this.metrics.apiEndpoints = apiFiles.length;
    console.log(`   📊 Found ${apiFiles.length} API endpoints`);
    
    const criticalEndpoints = [
      'cards/search/route.ts',
      'portfolio/route.ts',
      'auth/login/route.ts',
      'trades/route.ts'
    ];
    
    for (const endpoint of criticalEndpoints) {
      const endpointPath = apiFiles.find(f => f.includes(endpoint));
      if (endpointPath) {
        await this.analyzeApiEndpoint(endpointPath, endpoint);
      } else {
        console.log(`   ⚠️ API endpoint missing: ${endpoint}`);
      }
    }
    
    console.log('');
  }

  async analyzeApiEndpoint(filePath, endpointName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      
      console.log(`   ✅ ${endpointName}: ${lines} lines`);
      
      // Check for security and best practices
      const checks = {
        hasErrorHandling: content.includes('try') && content.includes('catch'),
        hasInputValidation: content.includes('validate') || content.includes('schema'),
        hasRateLimiting: content.includes('rateLimit') || content.includes('throttle'),
        usesSQLParams: content.includes('?') && content.includes('params'),
        hasResponseHelpers: content.includes('NextResponse'),
        hasLogging: content.includes('console.log') || content.includes('logger'),
        hasTypeScript: content.includes('NextRequest') && content.includes('NextResponse')
      };
      
      if (!checks.hasErrorHandling) {
        this.findings.security.push({
          type: 'warning',
          endpoint: endpointName,
          message: 'Missing comprehensive error handling'
        });
      }
      
      if (!checks.hasInputValidation) {
        this.findings.security.push({
          type: 'warning',
          endpoint: endpointName,
          message: 'Consider adding input validation schema'
        });
      }
      
      if (!checks.hasRateLimiting) {
        this.findings.security.push({
          type: 'info',
          endpoint: endpointName,
          message: 'Consider adding rate limiting for production'
        });
      }
      
      if (checks.usesSQLParams) {
        console.log(`      ✅ SQL injection protection: parameterized queries`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error analyzing ${endpointName}: ${error.message}`);
    }
  }

  async reviewDatabaseLayer() {
    console.log('🗄️ Reviewing Database Layer...');
    
    const dbPath = path.join(this.workspaceRoot, 'src/lib/database.ts');
    if (!fs.existsSync(dbPath)) {
      console.log('   ❌ Database layer not found');
      this.findings.architecture.push({
        type: 'error',
        message: 'Missing database abstraction layer'
      });
      return;
    }
    
    const content = fs.readFileSync(dbPath, 'utf8');
    const lines = content.split('\n').length;
    console.log(`   ✅ Database layer: ${lines} lines`);
    
    // Check database patterns
    const patterns = {
      hasConnectionPool: content.includes('pool') || content.includes('Pool'),
      hasSingleton: content.includes('singleton') || content.includes('getInstance'),
      hasErrorHandling: content.includes('try') && content.includes('catch'),
      hasTransactions: content.includes('transaction') || content.includes('BEGIN'),
      hasQueryBuilder: content.includes('SELECT') && content.includes('WHERE'),
      hasParameterizedQueries: content.includes('?') && content.includes('params'),
      hasConnectionManagement: content.includes('close') || content.includes('disconnect')
    };
    
    Object.entries(patterns).forEach(([pattern, found]) => {
      const status = found ? '✅' : '❌';
      const description = pattern.replace('has', '').replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`      ${status} ${description}: ${found ? 'implemented' : 'missing'}`);
      
      if (!found && ['hasErrorHandling', 'hasParameterizedQueries'].includes(pattern)) {
        this.findings.security.push({
          type: 'error',
          message: `Database layer missing critical feature: ${description}`
        });
      }
    });
    
    console.log('');
  }

  async reviewSecurity() {
    console.log('🔒 Security Analysis...');
    
    const securityChecks = [
      {
        name: 'Environment Variables',
        check: () => fs.existsSync(path.join(this.workspaceRoot, '.env.local')),
        severity: 'warning'
      },
      {
        name: 'Authentication Implementation',
        check: () => fs.existsSync(path.join(this.workspaceRoot, 'src/app/api/auth')),
        severity: 'error'
      },
      {
        name: 'Input Validation',
        check: () => this.searchCodebase('validate|sanitize|schema'),
        severity: 'warning'
      },
      {
        name: 'SQL Injection Protection',
        check: () => this.searchCodebase('\\?.*params'),
        severity: 'error'
      },
      {
        name: 'CORS Configuration',
        check: () => this.searchCodebase('cors|headers.*origin'),
        severity: 'info'
      }
    ];
    
    securityChecks.forEach(check => {
      const result = check.check();
      const status = result ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${result ? 'implemented' : 'needs attention'}`);
      
      if (!result) {
        this.findings.security.push({
          type: check.severity,
          message: `${check.name} needs implementation or review`
        });
      }
    });
    
    console.log('');
  }

  searchCodebase(pattern) {
    const regex = new RegExp(pattern, 'i');
    const srcFiles = this.getFilesRecursively(path.join(this.workspaceRoot, 'src'))
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
    
    for (const file of srcFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (regex.test(content)) {
          return true;
        }
      } catch (error) {
        // File might not be readable
      }
    }
    return false;
  }

  async reviewPerformance() {
    console.log('⚡ Performance Analysis...');
    
    const performanceChecks = [
      {
        name: 'Database Connection Pooling',
        check: () => this.searchCodebase('pool|singleton'),
        impact: 'High'
      },
      {
        name: 'Image Optimization',
        check: () => this.searchCodebase('next/image'),
        impact: 'Medium'
      },
      {
        name: 'Code Splitting',
        check: () => this.searchCodebase('dynamic|lazy'),
        impact: 'Medium'
      },
      {
        name: 'Caching Strategy',
        check: () => this.searchCodebase('cache|memo'),
        impact: 'Medium'
      },
      {
        name: 'Bundle Analysis',
        check: () => fs.existsSync(path.join(this.workspaceRoot, 'next.config.ts')),
        impact: 'Low'
      }
    ];
    
    performanceChecks.forEach(check => {
      const result = check.check();
      const status = result ? '✅' : '⚠️';
      console.log(`   ${status} ${check.name}: ${result ? 'optimized' : 'consider implementing'} (${check.impact} impact)`);
      
      if (!result && check.impact === 'High') {
        this.findings.performance.push({
          type: 'warning',
          message: `High impact performance optimization missing: ${check.name}`
        });
      }
    });
    
    console.log('');
  }

  async reviewMaintainability() {
    console.log('🔧 Maintainability Analysis...');
    
    const maintainabilityChecks = [
      {
        name: 'TypeScript Usage',
        check: () => fs.existsSync(path.join(this.workspaceRoot, 'tsconfig.json')),
        description: 'Type safety and developer experience'
      },
      {
        name: 'ESLint Configuration',
        check: () => fs.existsSync(path.join(this.workspaceRoot, 'eslint.config.mjs')),
        description: 'Code quality and consistency'
      },
      {
        name: 'Component Documentation',
        check: () => this.searchCodebase('interface.*Props|@param|@returns'),
        description: 'Developer documentation'
      },
      {
        name: 'Error Boundaries',
        check: () => this.searchCodebase('componentDidCatch|ErrorBoundary'),
        description: 'Error handling and debugging'
      },
      {
        name: 'Utility Functions',
        check: () => fs.existsSync(path.join(this.workspaceRoot, 'src/lib')),
        description: 'Code reusability'
      }
    ];
    
    maintainabilityChecks.forEach(check => {
      const result = check.check();
      const status = result ? '✅' : '⚠️';
      console.log(`   ${status} ${check.name}: ${check.description}`);
      
      if (!result) {
        this.findings.maintainability.push({
          type: 'info',
          message: `Consider implementing ${check.name}: ${check.description}`
        });
      }
    });
    
    console.log('');
  }

  async analyzeTestCoverage() {
    console.log('🧪 Test Coverage Analysis...');
    
    const testDirs = ['src/test', '__tests__', 'tests'];
    const hasTests = testDirs.some(dir => fs.existsSync(path.join(this.workspaceRoot, dir)));
    
    const testFiles = [];
    for (const dir of testDirs) {
      const dirPath = path.join(this.workspaceRoot, dir);
      if (fs.existsSync(dirPath)) {
        testFiles.push(...this.getFilesRecursively(dirPath)
          .filter(f => f.includes('.test.') || f.includes('.spec.')));
      }
    }
    
    console.log(`   📊 Test files found: ${testFiles.length}`);
    console.log(`   📈 Components tested: ${Math.min(testFiles.length, this.metrics.components)} / ${this.metrics.components}`);
    
    const testCoverage = this.metrics.components > 0 ? 
      (Math.min(testFiles.length, this.metrics.components) / this.metrics.components) * 100 : 0;
    
    this.metrics.testCoverage = testCoverage;
    
    if (testCoverage < 50) {
      this.findings.maintainability.push({
        type: 'warning',
        message: `Low test coverage: ${testCoverage.toFixed(1)}% - consider adding more tests`
      });
    }
    
    console.log(`   📊 Estimated test coverage: ${testCoverage.toFixed(1)}%`);
    console.log('');
  }

  async checkBestPractices() {
    console.log('💡 Best Practices Review...');
    
    const practices = [
      {
        name: 'Consistent File Naming',
        check: () => this.checkFileNamingConsistency(),
        importance: 'Medium'
      },
      {
        name: 'Component Separation',
        check: () => this.checkComponentSeparation(),
        importance: 'High'
      },
      {
        name: 'API Route Organization',
        check: () => this.checkApiOrganization(),
        importance: 'Medium'
      },
      {
        name: 'Environment Configuration',
        check: () => this.checkEnvironmentConfig(),
        importance: 'High'
      }
    ];
    
    practices.forEach(practice => {
      const result = practice.check();
      const status = result.passed ? '✅' : '⚠️';
      console.log(`   ${status} ${practice.name}: ${result.message} (${practice.importance} importance)`);
      
      if (!result.passed && practice.importance === 'High') {
        this.findings.bestPractices.push({
          type: 'warning',
          message: `Best practice violation: ${practice.name} - ${result.message}`
        });
      }
    });
    
    console.log('');
  }

  checkFileNamingConsistency() {
    // Check if components use PascalCase and utilities use camelCase
    const componentFiles = this.getFilesRecursively(path.join(this.workspaceRoot, 'src/components'));
    const inconsistent = componentFiles.filter(file => {
      const basename = path.basename(file, path.extname(file));
      return basename[0] !== basename[0].toUpperCase();
    });
    
    return {
      passed: inconsistent.length === 0,
      message: inconsistent.length === 0 ? 'consistent naming' : `${inconsistent.length} files with inconsistent naming`
    };
  }

  checkComponentSeparation() {
    const componentFiles = this.getFilesRecursively(path.join(this.workspaceRoot, 'src/components'));
    const largeComponents = componentFiles.filter(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        return content.split('\n').length > 500;
      } catch {
        return false;
      }
    });
    
    return {
      passed: largeComponents.length === 0,
      message: largeComponents.length === 0 ? 'well-sized components' : `${largeComponents.length} components over 500 lines`
    };
  }

  checkApiOrganization() {
    const apiDir = path.join(this.workspaceRoot, 'src/app/api');
    if (!fs.existsSync(apiDir)) return { passed: false, message: 'API directory missing' };
    
    const apiFiles = this.getFilesRecursively(apiDir);
    const properlyNamed = apiFiles.filter(file => file.endsWith('route.ts') || file.endsWith('route.js'));
    
    return {
      passed: properlyNamed.length > 0,
      message: `${properlyNamed.length} properly named API routes`
    };
  }

  checkEnvironmentConfig() {
    const hasEnvExample = fs.existsSync(path.join(this.workspaceRoot, '.env.example'));
    const hasEnvLocal = fs.existsSync(path.join(this.workspaceRoot, '.env.local'));
    
    return {
      passed: hasEnvExample || hasEnvLocal,
      message: hasEnvExample ? 'has .env.example' : hasEnvLocal ? 'has .env.local' : 'missing environment config'
    };
  }

  generateReport() {
    console.log('📋 COMPREHENSIVE CODE REVIEW REPORT');
    console.log('=====================================\n');
    
    // Metrics Summary
    console.log('📊 Project Metrics:');
    console.log(`   📁 Total Files: ${this.metrics.totalFiles}`);
    console.log(`   📄 Lines of Code: ${this.metrics.linesOfCode}`);
    console.log(`   ⚛️ React Components: ${this.metrics.components}`);
    console.log(`   🔗 API Endpoints: ${this.metrics.apiEndpoints}`);
    console.log(`   🧪 Test Coverage: ${this.metrics.testCoverage.toFixed(1)}%\n`);
    
    // Findings by Category
    const categories = Object.keys(this.findings);
    categories.forEach(category => {
      const findings = this.findings[category];
      if (findings.length > 0) {
        console.log(`🔍 ${category.charAt(0).toUpperCase() + category.slice(1)} Issues:`);
        findings.forEach(finding => {
          const icon = finding.type === 'error' ? '❌' : finding.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`   ${icon} ${finding.message}`);
          if (finding.component) console.log(`      Component: ${finding.component}`);
          if (finding.endpoint) console.log(`      Endpoint: ${finding.endpoint}`);
        });
        console.log('');
      }
    });
    
    // Overall Assessment
    const totalIssues = Object.values(this.findings).reduce((sum, issues) => sum + issues.length, 0);
    const errorCount = Object.values(this.findings).reduce((sum, issues) => 
      sum + issues.filter(i => i.type === 'error').length, 0);
    const warningCount = Object.values(this.findings).reduce((sum, issues) => 
      sum + issues.filter(i => i.type === 'warning').length, 0);
    
    console.log('🎯 Overall Assessment:');
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Warnings: ${warningCount}`);
    console.log(`   Info: ${totalIssues - errorCount - warningCount}`);
    
    let grade = 'A';
    if (errorCount > 0) grade = 'C';
    else if (warningCount > 5) grade = 'B';
    else if (warningCount > 2) grade = 'B+';
    
    console.log(`\n🏆 Code Quality Grade: ${grade}`);
    
    if (grade === 'A') {
      console.log('🌟 Excellent! Your codebase follows best practices with minimal issues.');
    } else if (grade.startsWith('B')) {
      console.log('👍 Good codebase with room for improvement. Address warnings for better quality.');
    } else {
      console.log('⚠️ Code needs attention. Please address errors and warnings for production readiness.');
    }
    
    console.log('\n🚀 Recommendations:');
    console.log('1. Address any errors immediately');
    console.log('2. Review and fix warning-level issues');
    console.log('3. Consider implementing suggested improvements');
    console.log('4. Add comprehensive test coverage');
    console.log('5. Document components and API endpoints\n');
  }
}

// Run the comprehensive review
if (require.main === module) {
  const reviewer = new CodeReviewAgent();
  reviewer.performReview().catch(console.error);
}

module.exports = CodeReviewAgent;
