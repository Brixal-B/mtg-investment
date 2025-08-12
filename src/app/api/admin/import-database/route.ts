import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '../../../../lib';
import { initializeDatabase } from '../../../../lib/database-init';
import { importMTGJSONToDatabase, getMTGJSONImportStats } from '../../../../lib/database/migration-tools';
import { ImportLogModel } from '../../../../lib/database/models';

/**
 * POST /api/admin/import-database
 * Import MTGJSON data to database using the new migration tools
 */
export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const body = await req.json();
    const { filePath, batchSize = 1000, skipExisting = true } = body;

    // Start the import process
    const importResult = await importMTGJSONToDatabase(filePath, {
      batchSize,
      skipExisting,
      progressCallback: (progress) => {
        console.log(`Import progress: ${progress.processedCards}/${progress.totalCards} cards, ${progress.processedPrices} prices`);
      }
    });

    return createSuccessResponse({
      success: true,
      importResult,
      message: 'MTGJSON import completed successfully'
    });

  } catch (error) {
    console.error('Error importing MTGJSON to database:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to import MTGJSON data to database',
      500
    );
  }
});

/**
 * GET /api/admin/import-database
 * Get database import status and statistics
 */
export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const url = new URL(req.url);
    
    if (url.searchParams.get('stats') === '1') {
      // Get import statistics
      const stats = await getMTGJSONImportStats();
      return createSuccessResponse(stats);
    }

    if (url.searchParams.get('logs') === '1') {
      // Get recent import logs
      const recentImports = await ImportLogModel.getRecent(10);
      return createSuccessResponse({ imports: recentImports });
    }

    if (url.searchParams.get('status') === '1') {
      // Get running imports
      const runningImports = await ImportLogModel.getRunning();
      const importStats = await ImportLogModel.getStats();
      
      return createSuccessResponse({
        running: runningImports,
        statistics: importStats,
        hasRunningImports: runningImports.length > 0
      });
    }

    // Default response with general info
    const [stats, recentImports, importStats] = await Promise.all([
      getMTGJSONImportStats(),
      ImportLogModel.getRecent(5),
      ImportLogModel.getStats()
    ]);

    return createSuccessResponse({
      databaseStats: stats,
      recentImports,
      importStatistics: importStats
    });

  } catch (error) {
    console.error('Error getting import status:', error);
    return createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to get import status',
      500
    );
  }
});