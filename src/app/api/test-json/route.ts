import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'AllPrices.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Read first few bytes to verify it's valid
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1000);
    const bytesRead = fs.readSync(fd, buffer, 0, 1000, 0);
    fs.closeSync(fd);
    
    const firstChars = buffer.toString('utf8', 0, bytesRead);
    
    return NextResponse.json({
      exists: true,
      size: stats.size,
      sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      lastModified: stats.mtime,
      firstChars: firstChars.substring(0, 200),
      isValidJson: firstChars.trim().startsWith('{')
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
