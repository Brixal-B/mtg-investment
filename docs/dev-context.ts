/**
 * DEVELOPMENT CONTEXT LOG
 * 
 * This file tracks important development decisions and context
 * that should be preserved across chat sessions.
 * 
 * Last Updated: [Current Date]
 * 
 * CURRENT PROJECT STATE:
 * - MTG Investment tracking application built with Next.js
 * - Uses MTGJSON data for card information
 * - Has admin tools for data management
 * - Contains a cleanup agent for automated maintenance
 * 
 * RECENT CHANGES:
 * - [Add your recent changes here]
 * 
 * ARCHITECTURE DECISIONS:
 * - Using SQLite for local data storage
 * - MTGJSON as primary data source
 * - Admin API routes for data management
 * - Cleanup agent for automated maintenance
 * 
 * KNOWN ISSUES:
 * - [List any known issues]
 * 
 * TODO:
 * - [List pending tasks]
 * 
 * IMPORTANT FILES:
 * - /lib/cleanup-agent.js - Automated cleanup system
 * - /src/app/api/admin/ - Admin API routes
 * - /src/components/ - React components
 */

export const DEV_CONTEXT = {
  lastUpdated: new Date().toISOString(),
  projectType: 'MTG Investment Tracker',
  framework: 'Next.js',
  database: 'SQLite',
  dataSource: 'MTGJSON'
};
