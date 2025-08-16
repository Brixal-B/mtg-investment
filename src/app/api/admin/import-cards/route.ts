import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ message: 'Import cards API endpoint - implementation pending' });
  } catch (error) {
    console.error('Import cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ message: 'Import cards POST endpoint - implementation pending' });
  } catch (error) {
    console.error('Import cards POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}