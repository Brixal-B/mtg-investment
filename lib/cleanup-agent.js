/**
 * 🧹 Cleanup Agent - Automated Codebase Maintenance
 * 
 * This agent runs after each specialized agent completes their work to:
 * - Remove test/backup files created during development
 * - Clean up temporary artifacts and debugging code
 * - Ensure production-ready codebase state
 * - Generate cleanup reports for transparency
 */

import fs from 'fs';
import path from 'path';

class CleanupAgent {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.cleanupLog = [];
    this.stats = {
      filesRemoved: 0,
      directoriesRemoved: 0,
      bytesFreed: 0,
      errors: 0
    };
  }

  /**
   * Main cleanup execution
   */
  async execute() {
    console.log('🧹 Cleanup Agent - Starting automated cleanup...');
    
    try {
      // Phase 1: Remove test and backup files
      await this.removeTestFiles();
      await this.removeBackupFiles();
      
      // Phase 2: Clean temporary artifacts
      await this.removeTempArtifacts();
      
      // Phase 3: Remove development-only files
      await this.removeDevOnlyFiles();
      
      // Phase 4: Clean empty directories
      await this.removeEmptyDirectories();
      
      // Phase 5: Generate report
      this.generateReport();
      
      console.log('✅ Cleanup Agent - Complete!');
      return this.stats;
      
    } catch (error) {
      console.error('❌ Cleanup Agent - Error:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Remove test files and test-related artifacts
   */
  async removeTestFiles() {
    const testPatterns = [
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      '**/cypress/**',
      '**/playwright/**',
      '**/*.e2e.{js,ts}',
      '**/coverage/**',
      '**/.nyc_output/**'
    ];

    await this.removeByPatterns(testPatterns, 'Test files');
  }

  /**
   * Remove backup and versioned files
   */
  async removeBackupFiles() {
    const backupPatterns = [
      '**/*-backup.*',
      '**/*-backup-*.*',
      '**/*.backup',
      '**/*-old.*',
      '**/*-refactored.*',
      '**/*-v[0-9]*.*',
      '**/*-copy.*',
      '**/*-original.*',
      '**/*.orig',
      '**/*~',
      '**/#*#'
    ];

    await this.removeByPatterns(backupPatterns, 'Backup files');
  }

  /**
   * Remove temporary artifacts from development
   */
  async removeTempArtifacts() {
    const tempPatterns = [
      '**/tmp/**',
      '**/temp/**',
      '**/.tmp/**',
      '**/debug/**',
      '**/debug.log',
      '**/error.log',
      '**/*.debug.{js,ts}',
      '**/progress-*.json',
      '**/import-*.log',
      '**/*-progress.json',
      '**/*.tmp',
      '**/temp-*.*',
      '**/*-temp.*'
    ];

    await this.removeByPatterns(tempPatterns, 'Temporary artifacts');
  }

  /**
   * Remove development-only files
   */
  async removeDevOnlyFiles() {
    const devPatterns = [
      '**/*.dev.{js,ts,jsx,tsx}',
      '**/dev-tools/**',
      '**/development/**',
      '**/.dev/**',
      '**/examples/**',
      '**/demo/**',
      '**/playground/**',
      '**/*.example.{js,ts,jsx,tsx}',
      '**/*.sample.{js,ts,jsx,tsx}'
    ];

    await this.removeByPatterns(devPatterns, 'Development-only files');
  }

  /**
   * Remove files matching glob patterns
   */
  async removeByPatterns(patterns, category) {
    const { glob } = await import('glob');
    
    for (const pattern of patterns) {
      try {
        const files = glob.globSync(pattern, {
          cwd: this.workspaceRoot,
          absolute: true,
          ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/.next/**'
          ]
        });

        for (const file of files) {
          await this.removeFileOrDirectory(file, category);
        }
      } catch (error) {
        this.log(`Error processing pattern ${pattern}: ${error.message}`, 'error');
        this.stats.errors++;
      }
    }
  }

  /**
   * Remove a file or directory
   */
  async removeFileOrDirectory(fullPath, category) {
    try {
      const stats = fs.statSync(fullPath);
      const relativePath = path.relative(this.workspaceRoot, fullPath);
      
      if (this.dryRun) {
        this.log(`[DRY RUN] Would remove ${category}: ${relativePath}`, 'info');
        return;
      }

      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        this.stats.directoriesRemoved++;
        this.log(`Removed directory (${category}): ${relativePath}`, 'success');
      } else {
        this.stats.bytesFreed += stats.size;
        fs.unlinkSync(fullPath);
        this.stats.filesRemoved++;
        this.log(`Removed file (${category}): ${relativePath}`, 'success');
      }
    } catch (error) {
      this.log(`Error removing ${fullPath}: ${error.message}`, 'error');
      this.stats.errors++;
    }
  }

  /**
   * Remove empty directories
   */
  async removeEmptyDirectories() {
    const findEmptyDirs = (dir) => {
      const items = fs.readdirSync(dir);
      
      if (items.length === 0) {
        return [dir];
      }
      
      let emptyDirs = [];
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          emptyDirs = emptyDirs.concat(findEmptyDirs(fullPath));
        }
      }
      
      // Check if directory is empty after processing subdirectories
      const remainingItems = fs.readdirSync(dir);
      if (remainingItems.length === 0) {
        emptyDirs.push(dir);
      }
      
      return emptyDirs;
    };

    try {
      const srcDir = path.join(this.workspaceRoot, 'src');
      if (fs.existsSync(srcDir)) {
        const emptyDirs = findEmptyDirs(srcDir);
        
        for (const dir of emptyDirs) {
          if (dir !== srcDir) { // Don't remove the src directory itself
            await this.removeFileOrDirectory(dir, 'Empty directories');
          }
        }
      }
    } catch (error) {
      this.log(`Error removing empty directories: ${error.message}`, 'error');
      this.stats.errors++;
    }
  }

  /**
   * Log cleanup actions
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    
    this.cleanupLog.push(logEntry);
    
    if (this.verbose || level === 'error') {
      const prefix = {
        info: '🔍',
        success: '✅',
        error: '❌',
        warning: '⚠️'
      }[level] || 'ℹ️';
      
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Generate cleanup report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      summary: `Cleanup completed: ${this.stats.filesRemoved} files and ${this.stats.directoriesRemoved} directories removed, ${this.formatBytes(this.stats.bytesFreed)} freed`,
      log: this.cleanupLog
    };

    // Write report to file
    const reportPath = path.join(this.workspaceRoot, 'cleanup-report.json');
    if (!this.dryRun) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Cleanup report saved to: ${reportPath}`);
    }

    // Console summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Files removed: ${this.stats.filesRemoved}`);
    console.log(`   Directories removed: ${this.stats.directoriesRemoved}`);
    console.log(`   Disk space freed: ${this.formatBytes(this.stats.bytesFreed)}`);
    console.log(`   Errors: ${this.stats.errors}`);

    return report;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default CleanupAgent;
