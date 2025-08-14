import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import Database, { PriceOperations, ImportLogOperations } from '@/lib/database';
import type { PriceRecord, ImportLog } from '@/types';

export const GET = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const cardUuid = url.searchParams.get('card');
  const days = parseInt(url.searchParams.get('days') || '180');

  try {
    if (cardUuid) {
      // Get price history for specific card
      const priceHistory = await PriceOperations.getPriceHistory(cardUuid, days);
      return createSuccessResponse(priceHistory, `Retrieved ${priceHistory.length} price records`);
    } else {
      // Get general price data statistics
      const dateRange = await PriceOperations.getDateRange();
      return createSuccessResponse(dateRange, 'Retrieved price data overview');
    }
  } catch (error) {
    return createErrorResponse(error, 'Failed to retrieve price history');
  }
});

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { dateRange, cards, metadata } = body;

    if (!cards || !Array.isArray(cards)) {
      return createErrorResponse(
        new Error('Invalid request body'),
        'Expected cards array in request body',
        400
      );
    }

    // Create import log entry
    const logId = await ImportLogOperations.createImportLog('price_update', {
      source: 'api_upload',
      cardCount: cards.length,
      dateRange: dateRange,
      metadata: metadata
    });

    let processedCount = 0;
    const errors: string[] = [];

    try {
      // Process cards and insert price records
      for (const card of cards) {
        if (!card.uuid || !card.prices) {
          errors.push(`Invalid card data: missing uuid or prices`);
          continue;
        }

        // Insert price records for each date
        for (const [date, price] of Object.entries(card.prices)) {
          if (typeof price === 'number' && price > 0) {
            try {
              // Ensure card exists before inserting price
              await PriceOperations.ensureCardExists(card.uuid, card.name);
              
              await PriceOperations.insertPriceRecord({
                card_uuid: card.uuid,
                date: date,
                price_usd: price,
                source: 'mtgjson'
              });
              processedCount++;
            } catch (error) {
              errors.push(`Failed to insert price for ${card.uuid} on ${date}: ${(error as Error).message}`);
            }
          }
        }
      }

      // Update import log with success
      await ImportLogOperations.updateImportLog(
        logId, 
        errors.length > 0 ? 'error' : 'success',
        processedCount,
        errors.length > 0 ? errors.slice(0, 10).join('; ') : undefined
      );

      const summary = {
        processedRecords: processedCount,
        totalCards: cards.length,
        errors: errors.length,
        errorSample: errors.slice(0, 5)
      };

      if (errors.length > 0) {
        return createSuccessResponse(
          summary,
          `Processed ${processedCount} price records with ${errors.length} errors`
        );
      } else {
        return createSuccessResponse(
          summary,
          `Successfully processed ${processedCount} price records`
        );
      }

    } catch (error) {
      // Update import log with error
      await ImportLogOperations.updateImportLog(
        logId,
        'error',
        processedCount,
        (error as Error).message
      );
      throw error;
    }

  } catch (error) {
    return createErrorResponse(error, 'Failed to process price history data');
  }
});