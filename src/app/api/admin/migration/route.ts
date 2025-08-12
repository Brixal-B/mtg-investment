import { NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import { MigrationManager } from '@/lib/migration';
import type { JsonMigrationOptions, CsvImportOptions } from '@/lib/migration/types';

const migrationManager = new MigrationManager();

export const GET = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    if (action === 'status') {
      // Get active migrations
      const activeMigrations = migrationManager.getActiveMigrations();
      return createSuccessResponse({ activeMigrations });
    } else if (action === 'history') {
      // Get migration history
      const limit = parseInt(searchParams.get('limit') || '50');
      const history = await migrationManager.getMigrationHistory(limit);
      return createSuccessResponse({ history });
    } else if (action === 'stats') {
      // Get database statistics
      const stats = await migrationManager.getDatabaseStats();
      return createSuccessResponse(stats);
    } else if (action === 'validate') {
      // Run data validation
      const checkCards = searchParams.get('cards') !== 'false';
      const checkPrices = searchParams.get('prices') !== 'false';
      const checkSets = searchParams.get('sets') !== 'false';
      const sampleSize = searchParams.get('sampleSize') ? 
        parseInt(searchParams.get('sampleSize')!) : undefined;

      const validation = await migrationManager.validateData({
        checkCards,
        checkPrices,
        checkSets,
        sampleSize
      });
      return createSuccessResponse(validation);
    } else if (action === 'integrity') {
      // Check data integrity
      const integrity = await migrationManager.checkIntegrity();
      return createSuccessResponse(integrity);
    } else if (action === 'config') {
      // Get configuration recommendations
      const config = await migrationManager.getConfigurationRecommendations();
      return createSuccessResponse(config);
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Migration admin API error:', error);
    return createErrorResponse(
      error,
      'Failed to execute migration admin action',
      500
    );
  }
});

export const POST = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action) {
    throw new Error('Action parameter is required');
  }

  try {
    const body = await request.json();

    if (action === 'start-json-migration') {
      // Start JSON migration
      const { sourceFile, options } = body as {
        sourceFile: string;
        options?: JsonMigrationOptions;
      };

      if (!sourceFile) {
        throw new Error('sourceFile is required');
      }

      const migrationId = await migrationManager.startJsonMigration(
        sourceFile,
        options || { sourceType: 'mtgjson' }
      );

      return createSuccessResponse({ 
        migrationId,
        message: 'JSON migration started successfully'
      });
    } else if (action === 'start-csv-import') {
      // Start CSV import
      const { sourceFile, options } = body as {
        sourceFile: string;
        options?: CsvImportOptions;
      };

      if (!sourceFile) {
        throw new Error('sourceFile is required');
      }

      const migrationId = await migrationManager.startCsvImport(
        sourceFile,
        options || {}
      );

      return createSuccessResponse({ 
        migrationId,
        message: 'CSV import started successfully'
      });
    } else if (action === 'cancel-migration') {
      // Cancel migration
      const { migrationId } = body as { migrationId: string };

      if (!migrationId) {
        throw new Error('migrationId is required');
      }

      const cancelled = await migrationManager.cancelMigration(migrationId);

      return createSuccessResponse({ 
        cancelled,
        message: cancelled ? 'Migration cancelled' : 'Migration not found or already completed'
      });
    } else if (action === 'cleanup') {
      // Clean up completed migrations
      const cleanedUp = await migrationManager.cleanupCompletedMigrations();

      return createSuccessResponse({ 
        cleanedUp,
        message: `Cleaned up ${cleanedUp} completed migrations`
      });
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Migration admin POST API error:', error);
    return createErrorResponse(
      error,
      'Failed to execute migration admin action',
      500
    );
  }
});