import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing MTGJSON connection...');
    
    const response = await fetch('https://mtgjson.com/api/v5/AllPrices.json', {
      method: 'HEAD' // Just get headers, not the full file
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type')
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
