import { NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib';
import { CsvImporter } from '@/lib/migration';

export const POST = withErrorHandling(async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'validate';

  try {
    const body = await request.json();
    const { filePath } = body as { filePath: string };

    if (!filePath) {
      throw new Error('filePath is required');
    }

    if (action === 'validate') {
      // Validate CSV format
      const validation = await CsvImporter.validateCsvFormat(filePath);
      return createSuccessResponse(validation);
    } else if (action === 'preview') {
      // Get import preview
      const maxRows = parseInt(searchParams.get('rows') || '10');
      const importer = new CsvImporter(filePath, {});
      const preview = await importer.getImportPreview(maxRows);
      return createSuccessResponse(preview);
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('CSV validation API error:', error);
    return createErrorResponse(
      error,
      'Failed to validate CSV file',
      500
    );
  }
});