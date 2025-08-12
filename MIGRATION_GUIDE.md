# MTG Investment Database Migration System - Phase 2

This document provides a comprehensive guide to the database migration and API integration system implemented in Phase 2.

## Overview

Phase 2 builds on the robust database foundation from Phase 1 to provide:

- **Complete JSON-to-Database Migration**: Import existing MTG card data from JSON files
- **Cardsphere CSV Import Pipeline**: Import price data from Cardsphere CSV exports
- **Database-Powered APIs**: All endpoints now use the database while maintaining backward compatibility
- **Migration Management Tools**: Admin interface for monitoring and controlling migrations
- **Performance Optimization**: Query caching, connection pooling, and optimization recommendations
- **Testing & Validation**: Comprehensive test suite for database integrity and API compatibility

## API Endpoints

### Core Data APIs

#### `/api/price-history`
Database-powered price history with multiple output formats:

```bash
# Legacy snapshot format (backward compatible)
GET /api/price-history?format=snapshot&limit=1000

# Enhanced cards format with analytics
GET /api/price-history?format=cards&limit=100&search=Lightning

# Detailed price history for specific cards
GET /api/price-history?format=history&cards=uuid1,uuid2,uuid3
```

**Query Parameters:**
- `format`: `snapshot` | `cards` | `history`
- `limit`: Number of results (default: 1000)
- `search`: Card name search
- `set`: Filter by set code
- `minPrice` / `maxPrice`: Price range filtering
- `withoutPrices`: Include cards without price data

#### `/api/mtgjson-data`
Database-powered MTG data with comprehensive metadata:

```bash
# Database metadata
GET /api/mtgjson-data?action=meta

# Card data with search and pagination
GET /api/mtgjson-data?action=cards&search=Dragon&limit=50&page=1

# Set information
GET /api/mtgjson-data?action=sets

# Database statistics
GET /api/mtgjson-data?action=stats
```

### Admin APIs

#### `/api/admin/migration`
Control and monitor migration operations:

```bash
# Get active migrations status
GET /api/admin/migration?action=status

# Get migration history
GET /api/admin/migration?action=history&limit=50

# Get database statistics
GET /api/admin/migration?action=stats

# Run data validation
GET /api/admin/migration?action=validate

# Check data integrity
GET /api/admin/migration?action=integrity

# Get configuration recommendations
GET /api/admin/migration?action=config
```

**POST Operations:**
```bash
# Start JSON migration
POST /api/admin/migration?action=start-json-migration
{
  "sourceFile": "/path/to/AllPrices.json",
  "options": {
    "sourceType": "mtgjson",
    "batchSize": 1000,
    "continueOnError": true
  }
}

# Start CSV import
POST /api/admin/migration?action=start-csv-import
{
  "sourceFile": "/path/to/cardsphere-export.csv",
  "options": {
    "batchSize": 500,
    "delimiter": ",",
    "encoding": "utf8"
  }
}

# Cancel migration
POST /api/admin/migration?action=cancel-migration
{
  "migrationId": "migration_12345"
}
```

#### `/api/admin/csv-validation`
Validate and preview CSV imports:

```bash
# Validate CSV format
POST /api/admin/csv-validation?action=validate
{
  "filePath": "/path/to/file.csv"
}

# Get import preview
POST /api/admin/csv-validation?action=preview&rows=20
{
  "filePath": "/path/to/file.csv"
}
```

#### `/api/admin/validation`
Database testing and performance monitoring:

```bash
# Run database tests
GET /api/admin/validation?action=database

# Test API compatibility
GET /api/admin/validation?action=api

# Get performance statistics
GET /api/admin/validation?action=performance

# Warm up query cache
GET /api/admin/validation?action=warmup
```

## Migration Usage Examples

### 1. JSON Migration (MTGJSON Import)

```typescript
import { JsonMigration } from '@/lib/migration';

// Start MTGJSON migration
const migration = new JsonMigration('/path/to/AllPrices.json', {
  sourceType: 'mtgjson',
  batchSize: 5000,
  continueOnError: true,
  progressCallback: (progress) => {
    console.log(`Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`);
    console.log(`Rate: ${progress.rate} items/sec, ETA: ${progress.eta}s`);
  }
});

const result = await migration.run();
console.log(`Migration completed: ${result.processed} processed, ${result.failed} failed`);
```

### 2. CSV Import (Cardsphere Data)

```typescript
import { CsvImporter } from '@/lib/migration';

// Validate CSV before import
const validation = await CsvImporter.validateCsvFormat('/path/to/cardsphere.csv');
if (!validation.valid) {
  console.error('Missing required fields:', validation.missingFields);
  return;
}

// Preview import
const importer = new CsvImporter('/path/to/cardsphere.csv', {
  batchSize: 1000,
  maxFileSize: 50 * 1024 * 1024 // 50MB
});

const preview = await importer.getImportPreview(10);
console.log(`Preview: ${preview.totalRows} total rows, ${preview.estimatedMatches} estimated matches`);

// Run import
const result = await importer.run();
console.log(`Import completed: ${result.processed} processed, ${result.failed} failed`);
```

### 3. Migration Management

```typescript
import { MigrationManager } from '@/lib/migration';

const manager = new MigrationManager();

// Start migrations
const jsonMigrationId = await manager.startJsonMigration('/path/to/data.json', {
  sourceType: 'mtgjson'
});

const csvMigrationId = await manager.startCsvImport('/path/to/prices.csv', {});

// Monitor progress
const activeMigrations = manager.getActiveMigrations();
activeMigrations.forEach(migration => {
  console.log(`${migration.id}: ${migration.progress.percentage}% complete`);
});

// Validate data after migration
const validation = await manager.validateData({
  checkCards: true,
  checkPrices: true,
  checkSets: true
});

console.log(`Validation: ${validation.overall.valid ? 'PASSED' : 'FAILED'}`);
console.log(`Errors: ${validation.overall.totalErrors}, Warnings: ${validation.overall.totalWarnings}`);
```

### 4. Performance Optimization

```typescript
import { dbOptimizer, queryOptimizer } from '@/lib/performance';

// Warm up cache for better performance
await dbOptimizer.warmCache();

// Use cached queries
const result = await dbOptimizer.executeWithCache(
  'SELECT * FROM cards WHERE set_code = ?',
  ['LEA'],
  3600 // 1 hour TTL
);

// Analyze query performance
const analysis = await queryOptimizer.analyzeQuery(
  'SELECT * FROM price_history WHERE card_uuid = ? AND price_date > ?',
  ['some-uuid', '2024-01-01']
);

console.log('Recommendations:', analysis.recommendations);
console.log('Index suggestions:', analysis.indexSuggestions);

// Generate optimized queries
const optimizedQuery = queryOptimizer.generateOptimizedPriceQuery(
  'card-uuid',
  { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
  ['tcgplayer', 'cardkingdom'],
  1000
);

console.log('Optimized SQL:', optimizedQuery.sql);
```

### 5. Data Testing and Validation

```typescript
import { databaseTester, apiCompatibilityTester } from '@/lib/testing';

// Run comprehensive database tests
const dbReport = await databaseTester.runAllTests();
console.log(`Database tests: ${dbReport.passedTests}/${dbReport.totalTests} passed`);

// Test API compatibility
const apiReport = await apiCompatibilityTester.testApiCompatibility();
console.log(`API compatibility: ${apiReport.overallSuccess ? 'PASSED' : 'FAILED'}`);

// Review specific test results
dbReport.results.forEach(test => {
  if (!test.success) {
    console.error(`FAILED: ${test.name} - ${test.message}`);
    console.error('Details:', test.details);
  }
});
```

## Configuration

### Database Configuration

The system uses the existing database configuration from Phase 1:

```typescript
// src/lib/config.ts
export const DATABASE: DatabaseConfig = {
  type: process.env.DATABASE_TYPE || 'sqlite',
  filename: process.env.DATABASE_URL || '/data/mtg-investment.db',
  // ... other database settings
};
```

### Migration Configuration

Configure migration behavior:

```typescript
const migrationOptions = {
  batchSize: 1000,           // Items per batch
  continueOnError: true,     // Don't stop on individual errors
  dryRun: false,            // Set to true for testing
  skipValidation: false,     // Enable data validation
  progressCallback: (progress) => {
    // Handle progress updates
  }
};
```

### Performance Configuration

```typescript
// Configure connection pooling
connectionManager.configure(10); // Max 10 connections

// Configure cache TTL
const cacheOptions = {
  cardData: 3600,      // 1 hour
  priceData: 1800,     // 30 minutes
  setData: 7200        // 2 hours
};
```

## Error Handling and Recovery

### Automatic Recovery

The migration system includes robust error recovery:

- **Retry Logic**: Automatic retry with exponential backoff
- **Checkpointing**: Resume from last successful batch
- **Transaction Safety**: Rollback on critical failures
- **Data Validation**: Comprehensive validation before and after migration

### Manual Recovery

For manual intervention:

```typescript
// Create checkpoint
const recovery = new ErrorRecovery();
recovery.createCheckpoint('migration-id', progress, lastSuccessfulBatch);

// Resume from checkpoint
const checkpoint = recovery.getCheckpoint('migration-id');
if (checkpoint) {
  // Resume migration from checkpoint
}

// Validate recovery
const validation = await recovery.validateRecovery(
  data,
  (item) => validateItem(item),
  100 // Sample size
);
```

## Monitoring and Debugging

### Migration Logs

All migrations are logged to the `import_logs` table:

```sql
SELECT * FROM import_logs 
WHERE import_type = 'JsonMigration' 
ORDER BY started_at DESC;
```

### Performance Monitoring

```typescript
// Get cache statistics
const cacheStats = dbOptimizer.getCacheStats();
console.log(`Cache size: ${cacheStats.size} entries`);
console.log(`Memory usage: ${cacheStats.memoryUsage}`);

// Get connection pool statistics
const poolStats = connectionManager.getPoolStats();
console.log(`Pool utilization: ${poolStats.utilization}%`);
```

### Integrity Checking

```typescript
import { IntegrityChecker } from '@/lib/migration';

const checker = new IntegrityChecker();

// Generate comprehensive integrity report
const report = await checker.generateIntegrityReport();
console.log(`Database health: ${report.summary.healthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
console.log(`Total issues: ${report.summary.totalIssues}`);
console.log('Recommendations:', report.recommendations);
```

## Production Deployment

### Pre-deployment Checklist

1. **Database Setup**: Ensure Phase 1 database schema is deployed
2. **Environment Variables**: Configure database connection settings
3. **File Permissions**: Ensure read access to source files
4. **Memory Allocation**: Allocate sufficient memory for large imports
5. **Backup Strategy**: Backup existing data before migration

### Migration Strategy

1. **Test Migration**: Run with `dryRun: true` first
2. **Validate Data**: Use validation APIs to check data integrity
3. **Incremental Migration**: Start with smaller datasets
4. **Monitor Performance**: Watch cache hit rates and query performance
5. **Rollback Plan**: Prepare rollback procedures for critical failures

### Performance Tuning

- **Batch Size**: Adjust based on available memory and performance
- **Connection Pooling**: Configure based on concurrent load
- **Cache TTL**: Balance freshness vs performance needs
- **Index Optimization**: Monitor query patterns and optimize indexes

## Troubleshooting

### Common Issues

1. **Memory Issues**: Reduce batch size, enable memory cleanup
2. **Performance Problems**: Check indexes, enable query caching
3. **Data Validation Errors**: Review validation logs, fix data quality issues
4. **Connection Timeouts**: Increase connection pool size, check network
5. **File Access Errors**: Verify file permissions and paths

### Debug Mode

Enable detailed logging:

```typescript
const migration = new JsonMigration(file, {
  ...options,
  progressCallback: (progress) => {
    console.log(`[DEBUG] Phase: ${progress.phase}`);
    console.log(`[DEBUG] Progress: ${progress.processed}/${progress.total}`);
    if (progress.errors.length > 0) {
      console.log(`[DEBUG] Recent errors:`, progress.errors.slice(-3));
    }
  }
});
```

## API Backward Compatibility

All existing API endpoints maintain 100% backward compatibility:

- **Response Formats**: All existing response structures preserved
- **Query Parameters**: All existing parameters supported
- **Error Handling**: Consistent error response format
- **Performance**: Equal or better performance than JSON-based system

The database-powered APIs provide the same interface while adding:
- Enhanced filtering and search capabilities
- Real-time analytics and price calculations
- Better performance for large datasets
- Consistent data integrity

## Support and Maintenance

### Regular Maintenance

- **Cache Cleanup**: Regularly clean expired cache entries
- **Log Rotation**: Archive old migration logs
- **Integrity Checks**: Run periodic integrity validations
- **Performance Monitoring**: Monitor query performance and optimize as needed

### Monitoring Endpoints

Use the admin APIs for regular health checks:

```bash
# Daily health check
curl "/api/admin/validation?action=database"

# Weekly integrity check
curl "/api/admin/migration?action=integrity"

# Performance monitoring
curl "/api/admin/validation?action=performance"
```

This completes the Phase 2 database migration and API integration system, providing a robust, scalable, and maintainable foundation for the MTG Investment application.