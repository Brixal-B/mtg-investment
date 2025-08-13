#!/usr/bin/env node

/**
 * Database Backup Utility
 * Database Agent utility for creating production backups
 */

const fs = require('fs');
const path = require('path');

function createBackup() {
  const src = './data/mtg-investment.db';
  const timestamp = new Date().toISOString().split('T')[0];
  const dest = `./data/backup-${timestamp}-mtg-investment.db`;
  
  try {
    if (!fs.existsSync(src)) {
      console.error('❌ Source database not found:', src);
      process.exit(1);
    }
    
    fs.copyFileSync(src, dest);
    const stats = fs.statSync(dest);
    
    console.log('✅ Database backed up successfully!');
    console.log(`📍 Source: ${src}`);
    console.log(`📁 Backup: ${dest}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

createBackup();
