/**
 * File system utilities with proper error handling and path management
 */

import fs from 'fs/promises';
import { existsSync, createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { FILES, ensureDirectories } from './config';
import { handleFileError } from './errors';

/**
 * Safe file read with proper error handling
 */
export async function safeReadFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    handleFileError(error, 'read', filePath);
  }
}

/**
 * Safe file write with directory creation
 */
export async function safeWriteFile(filePath: string, data: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, data, encoding);
  } catch (error) {
    handleFileError(error, 'write', filePath);
  }
}

/**
 * Safe JSON read with error handling
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  try {
    const content = await safeReadFile(filePath);
    
    // Check if content is empty or just whitespace
    if (!content || content.trim().length === 0) {
      throw new Error(`Empty or whitespace-only JSON file: ${filePath}`);
    }
    
    // Try to parse the JSON
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Provide more detailed error information for JSON syntax errors
      const message = error.message.includes('Unexpected end of JSON input') 
        ? `Incomplete or truncated JSON file: ${filePath}. The file may be corrupted or still being written.`
        : `Invalid JSON syntax in file: ${filePath}. Error: ${error.message}`;
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * Safe JSON write with pretty formatting
 */
export async function writeJsonFile<T = any>(filePath: string, data: T): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await safeWriteFile(filePath, content);
  } catch (error) {
    handleFileError(error, 'write JSON to', filePath);
  }
}

/**
 * Check if file exists safely
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Get file stats safely
 */
export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await getFileStats(filePath);
  return stats?.size || 0;
}

/**
 * Delete file safely
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      handleFileError(error, 'delete', filePath);
    }
  }
}

/**
 * Move/rename file safely
 */
export async function moveFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    
    await fs.rename(sourcePath, targetPath);
  } catch (error) {
    handleFileError(error, 'move', `${sourcePath} to ${targetPath}`);
  }
}

/**
 * Copy file safely
 */
export async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    
    await fs.copyFile(sourcePath, targetPath);
  } catch (error) {
    handleFileError(error, 'copy', `${sourcePath} to ${targetPath}`);
  }
}

/**
 * Initialize application file structure
 */
export async function initializeFileSystem(): Promise<void> {
  try {
    await ensureDirectories();
    console.log('File system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize file system:', error);
    throw error;
  }
}

/**
 * Get application file status
 */
export async function getAppFileStatus() {
  const files = [
    { name: 'AllPrices.json', path: FILES.MTGJSON_ALLPRICES, fallback: FILES.MTGJSON_ALLPRICES_LOCAL },
    { name: 'price-history.json', path: FILES.PRICE_HISTORY },
  ];

  const status = await Promise.all(
    files.map(async (file) => {
      let filePath = file.path;
      let exists = fileExists(filePath);
      
      // Check fallback location if primary doesn't exist
      if (!exists && file.fallback) {
        filePath = file.fallback;
        exists = fileExists(filePath);
      }
      
      const size = exists ? await getFileSize(filePath) : 0;
      const stats = exists ? await getFileStats(filePath) : null;
      
      return {
        name: file.name,
        path: filePath,
        exists,
        size,
        lastModified: stats?.mtime?.toISOString(),
      };
    })
  );

  return status;
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempFiles = [
    FILES.DOWNLOAD_PROGRESS,
    FILES.IMPORT_PROGRESS_LOCK,
    FILES.IMPORT_PROGRESS_DATA,
    FILES.IMPORT_LOG,
  ];

  await Promise.all(
    tempFiles.map(async (filePath) => {
      try {
        await deleteFile(filePath);
      } catch (error) {
        console.warn(`Failed to delete temp file: ${filePath}`, error);
      }
    })
  );
}
