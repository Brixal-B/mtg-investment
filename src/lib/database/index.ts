/**
 * Database connection layer for MTG Investment app
 * Supports SQLite (development) and PostgreSQL (production)
 */

export { default as db } from './connection';
export { runMigrations } from './migrations';
export * from './models';
export * from './types';