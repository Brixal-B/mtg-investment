// Usage: node load-mtgjson-price-history.js [AllPrices.json] [apiUrl] [--debug]
// Default apiUrl: http://localhost:3000/api/price-history
// --debug flag: Only process first 20 cards for testing
// Enhanced: Collects last 6 months of price data with 1-month spacing

const fs = require('fs');
const https = require('https');
const path = require('path');
const fetch = require('node-fetch');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamObject } = require('stream-json/streamers/StreamObject');

// Import centralized configuration
const { FILES, API } = require('./lib/node-config');

const MTGJSON_URL = 'https://mtgjson.com/api/v5/AllPrices.json';
const LOCAL_FILE = process.argv[2] || FILES.MTGJSON_ALLPRICES_LOCAL;
const API_URL = process.argv[3] || (API.BASE_URL + API.ENDPOINTS.PRICE_HISTORY);

// Check for debug mode
const DEBUG_MODE = process.argv.includes('--debug') || process.argv.includes('debug') || process.env.DEBUG_IMPORT === 'true';
const DEBUG_LIMIT = DEBUG_MODE ? 20 : null;

  // Generate target dates for last 6 months (going backwards from today)
  const today = new Date();
  const TARGET_DATES = [];
  
  for (let i = 0; i < 6; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, today.getDate());
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    TARGET_DATES.push(dateStr);
  }
  
  console.log(`📅 Target dates for price collection: ${TARGET_DATES.join(', ')}`);

// Enhanced debug configuration
const DEBUG_CONFIG = {
  SHOW_CARD_DETAILS: true,
  SHOW_PRICE_ANALYSIS: true,
  SHOW_SET_STATISTICS: true,
  SHOW_MONTHLY_TRENDS: true,    // New: Show price trends across months
  USE_FALLBACK_DATES: false,    // Whether to use fallback dates if target dates not found
  VERBOSE_LOGGING: true,          // Show detailed card-by-card processing
};

// Optimized configuration
const CONFIG = {
  BATCH_SIZE: 5000,                    
  PROGRESS_UPDATE_INTERVAL: DEBUG_MODE ? 1 : 25000,     
  RATE_WINDOW_SIZE: 3,                 
  ESTIMATED_TOTAL: DEBUG_MODE ? DEBUG_LIMIT : 500000,   
  MEMORY_CLEANUP_INTERVAL: 50000       
};

console.log(DEBUG_MODE ? `🐛 ENHANCED DEBUG MODE: Processing ${DEBUG_LIMIT} cards with detailed analysis` : '📊 FULL MODE: Processing all cards');

if (DEBUG_MODE) {
  console.log(`🐛 Debug Features Enabled:`);
  console.log(`🐛   📋 Card Details: ${DEBUG_CONFIG.SHOW_CARD_DETAILS ? '✅' : '❌'}`);
  console.log(`🐛   💰 Price Analysis: ${DEBUG_CONFIG.SHOW_PRICE_ANALYSIS ? '✅' : '❌'}`);
  console.log(`🐛   🃏 Set Statistics: ${DEBUG_CONFIG.SHOW_SET_STATISTICS ? '✅' : '❌'}`);
  console.log(`🐛   📅 Fallback Dates: ${DEBUG_CONFIG.USE_FALLBACK_DATES ? '✅' : '❌'}`);
  console.log(`🐛   🔍 Verbose Logging: ${DEBUG_CONFIG.VERBOSE_LOGGING ? '✅' : '❌'}`);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  // Download if not present
  if (!fs.existsSync(LOCAL_FILE)) {
    console.log('Downloading AllPrices.json from MTGJSON...');
    await download(MTGJSON_URL, LOCAL_FILE);
    console.log('Download complete.');
  }
  
  // Parse file using stream-json with optimized single-pass processing
  console.log('Processing AllPrices.json (optimized streaming)...');
  console.log(`🎯 Collecting price data for last 6 months: ${TARGET_DATES.join(', ')}`);
  
  const cards = [];
  const progressPath = FILES.IMPORT_PROGRESS_DATA;
  let processed = 0;
  let validCards = 0;
  const startTime = Date.now();
  
  // Debug statistics for monthly price trends
  const monthlyStats = new Map();
  TARGET_DATES.forEach(date => {
    monthlyStats.set(date, { found: 0, total: 0 });
  });
  
  // Enhanced debug tracking
  const debugStats = {
    setStats: new Map(),
    priceRanges: { under1: 0, under10: 0, under100: 0, over100: 0 },
    cardsWithoutPrices: [],
    cardsWithPrices: [],
    dateSuccessRate: new Map()
  };
  
  // Rate calculation with moving average
  const rateWindow = [];
  let lastProgressTime = Date.now();
  let lastProgressCount = 0;
  
  function writeProgress(force = false) {
    if (!force && processed % CONFIG.PROGRESS_UPDATE_INTERVAL !== 0) return;
    
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    
    // Calculate rate using moving average
    const windowElapsed = (now - lastProgressTime) / 1000;
    const windowProcessed = processed - lastProgressCount;
    
    if (windowElapsed > 0 && windowProcessed > 0) {
      const currentRate = windowProcessed / windowElapsed;
      rateWindow.push(currentRate);
      if (rateWindow.length > CONFIG.RATE_WINDOW_SIZE) rateWindow.shift();
    }
    
    const rate = rateWindow.length > 0 ? rateWindow.reduce((a, b) => a + b, 0) / rateWindow.length : 0;
    
    // Estimate progress
    let eta = null;
    let percent = 0;
    
    if (processed < CONFIG.ESTIMATED_TOTAL) {
      percent = Math.min(95, Math.round((processed / CONFIG.ESTIMATED_TOTAL) * 100));
      if (rate > 0) {
        eta = (CONFIG.ESTIMATED_TOTAL - processed) / rate;
      }
    } else {
      percent = 99; // Almost done but not 100% until we finish
    }
    
    lastProgressTime = now;
    lastProgressCount = processed;
    
    // Console output less frequently to reduce terminal I/O
    if (force || processed % (CONFIG.PROGRESS_UPDATE_INTERVAL * 2) === 0) {
      const mins = Math.floor(elapsed / 60);
      const secs = Math.round(elapsed % 60);
      const etaStr = eta ? `${Math.floor(eta / 60)}m ${Math.round(eta % 60)}s` : 'N/A';
      console.log(`[PROGRESS] ${processed} cards (${percent}%) | Valid: ${validCards} | ${rate.toFixed(0)}/sec | ${mins}m${secs}s | ETA: ${etaStr}`);
    }
    
    // Write progress file
    try {
      fs.writeFileSync(progressPath, JSON.stringify({
        total: Math.max(processed, CONFIG.ESTIMATED_TOTAL),
        processed,
        percent,
        elapsed,
        eta,
        rate,
        inProgress: true,
        phase: 'processing'
      }));
    } catch (err) {
      // Ignore progress file write errors to avoid stopping the process
    }
  }

  await new Promise((resolve, reject) => {
    const pipeline = chain([
      fs.createReadStream(LOCAL_FILE, { highWaterMark: 64 * 1024 }), // 64KB buffer for better I/O
      parser(),
      pick({ filter: 'data' }),
      streamObject(),
    ]);

    pipeline.on('data', ({ key, value }) => {
      processed++;
      
      // In AllPrices.json, key = UUID, value = price data structure
      const uuid = key;
      const priceData = value;
      
      // Debug mode: show detailed card information
      if (DEBUG_MODE && DEBUG_CONFIG.SHOW_CARD_DETAILS) {
        console.log(`🐛 [${processed}/${DEBUG_LIMIT}] UUID: ${uuid.slice(0, 8)}... | Price sources: ${Object.keys(priceData).join(', ')}`);
      }
      
      // Collect price data for last 6 months from MTGJSON structure
      const monthlyPrices = {};
      let hasAnyPrice = false;
      
      if (DEBUG_MODE && DEBUG_CONFIG.VERBOSE_LOGGING) {
        console.log(`🐛 [${processed}] Processing UUID: ${uuid.slice(0, 8)}...`);
        if (priceData) {
          console.log(`🐛    Price structure available: ${Object.keys(priceData).join(', ')}`);
        } else {
          console.log(`🐛    No price data structure found`);
        }
      }
      
      if (priceData) {
        // Collect prices for each target date from the actual MTGJSON structure
        TARGET_DATES.forEach(targetDate => {
          const monthStats = monthlyStats.get(targetDate);
          monthStats.total++;
          
          let foundPrice = null;
          
          // Search through the MTGJSON price structure for USD prices
          // Structure: priceData.paper.tcgplayer.retail.normal[date] or priceData.paper.tcgplayer.retail.foil[date]
          if (priceData.paper?.tcgplayer?.retail?.normal?.[targetDate]) {
            foundPrice = priceData.paper.tcgplayer.retail.normal[targetDate];
          } else if (priceData.paper?.tcgplayer?.retail?.foil?.[targetDate]) {
            foundPrice = priceData.paper.tcgplayer.retail.foil[targetDate];
          } else if (priceData.paper?.cardkingdom?.retail?.normal?.[targetDate]) {
            foundPrice = priceData.paper.cardkingdom.retail.normal[targetDate];
          } else if (priceData.paper?.cardkingdom?.retail?.foil?.[targetDate]) {
            foundPrice = priceData.paper.cardkingdom.retail.foil[targetDate];
          }
          
          if (foundPrice && typeof foundPrice === 'number' && foundPrice > 0 && isFinite(foundPrice)) {
            monthlyPrices[targetDate] = Math.round(foundPrice * 100) / 100;
            monthStats.found++;
            hasAnyPrice = true;
            
            if (DEBUG_MODE && DEBUG_CONFIG.VERBOSE_LOGGING) {
              console.log(`🐛    ✅ Found price for ${targetDate}: $${monthlyPrices[targetDate]}`);
            }
          } else if (DEBUG_MODE && DEBUG_CONFIG.VERBOSE_LOGGING) {
            console.log(`🐛    ❌ No price for ${targetDate}`);
          }
        });
      }
      
      // Only include cards that have at least one price point
      if (hasAnyPrice) {
        cards.push({ 
          uuid: uuid,
          prices: monthlyPrices  // Store multiple months worth of prices
        });
        validCards++;
        
        // Enhanced debug logging for cards with prices
        if (DEBUG_MODE) {
          const priceCount = Object.keys(monthlyPrices).length;
          const avgPrice = Object.values(monthlyPrices).reduce((a, b) => a + b, 0) / priceCount;
          const priceRange = `$${Math.min(...Object.values(monthlyPrices))}-$${Math.max(...Object.values(monthlyPrices))}`;
          
          console.log(`🐛 ✅ [${processed}] UUID: ${uuid.slice(0, 8)}...`);
          console.log(`🐛    📊 ${priceCount}/6 months | Avg: $${avgPrice.toFixed(2)} | Range: ${priceRange}`);
          
          if (DEBUG_CONFIG.SHOW_MONTHLY_TRENDS) {
            const sortedPrices = TARGET_DATES.map(date => monthlyPrices[date] ? `${date}: $${monthlyPrices[date]}` : `${date}: -`);
            console.log(`🐛    📅 ${sortedPrices.join(' | ')}`);
          }
          
          // Track price ranges based on average
          if (avgPrice < 1) debugStats.priceRanges.under1++;
          else if (avgPrice < 10) debugStats.priceRanges.under10++;
          else if (avgPrice < 100) debugStats.priceRanges.under100++;
          else debugStats.priceRanges.over100++;
          
          debugStats.cardsWithPrices.push({ uuid: uuid.slice(0, 8) + '...', avgPrice, priceCount });
        }
      } else if (DEBUG_MODE) {
        // Track cards without prices
        console.log(`🐛 ❌ [${processed}] UUID: ${uuid.slice(0, 8)}... - No price data for any target month`);
        debugStats.cardsWithoutPrices.push({ uuid: uuid.slice(0, 8) + '...' });
      }
      
      // Debug mode: stop after processing the limit
      if (DEBUG_MODE && processed >= DEBUG_LIMIT) {
        console.log(`🐛 DEBUG: Reached limit of ${DEBUG_LIMIT} cards, stopping...`);
        pipeline.destroy();
        return;
      }
      
      // Memory optimization: force garbage collection periodically
      if (processed % CONFIG.MEMORY_CLEANUP_INTERVAL === 0 && global.gc) {
        global.gc();
      }
      
      // Update progress
      writeProgress();
    });

    pipeline.on('end', () => {
      // Final progress update
      writeProgress(true);
      console.log(`\n[COMPLETE] Processed ${processed} total cards, extracted ${validCards} with monthly price data (last 6 months)`);
      
      // Summary of monthly data coverage
      console.log(`\n📅 Monthly Data Coverage Summary:`);
      monthlyStats.forEach((stats, date) => {
        const coverage = stats.total > 0 ? ((stats.found / stats.total) * 100).toFixed(1) : '0.0';
        console.log(`   ${date}: ${stats.found}/${stats.total} cards (${coverage}%)`);
      });
      resolve();
    });

    pipeline.on('close', () => {
      // Handle early termination in debug mode
      if (DEBUG_MODE && processed >= DEBUG_LIMIT) {
        writeProgress(true);
        
        // Enhanced debug summary
        console.log(`\n🐛 [DEBUG COMPLETE] Processed ${processed} cards (debug limit reached), extracted ${validCards} with valid USD prices`);
        
        if (DEBUG_CONFIG.SHOW_PRICE_ANALYSIS && validCards > 0) {
          console.log(`\n🐛 📊 PRICE ANALYSIS (Last 6 Months):`);
          console.log(`🐛   💰 Price Ranges (based on average):`);
          console.log(`🐛     Under $1:    ${debugStats.priceRanges.under1} cards`);
          console.log(`🐛     $1-$10:      ${debugStats.priceRanges.under10} cards`);
          console.log(`🐛     $10-$100:    ${debugStats.priceRanges.under100} cards`);
          console.log(`🐛     Over $100:   ${debugStats.priceRanges.over100} cards`);
          
          const avgOfAvgPrices = debugStats.cardsWithPrices.reduce((sum, card) => sum + card.avgPrice, 0) / validCards;
          const maxAvgPrice = Math.max(...debugStats.cardsWithPrices.map(card => card.avgPrice));
          const minAvgPrice = Math.min(...debugStats.cardsWithPrices.map(card => card.avgPrice));
          
          console.log(`🐛   📈 Statistics:`);
          console.log(`🐛     Average Price (6-month avg): $${avgOfAvgPrices.toFixed(2)}`);
          console.log(`🐛     Highest Avg Price: $${maxAvgPrice.toFixed(2)}`);
          console.log(`🐛     Lowest Avg Price:  $${minAvgPrice.toFixed(2)}`);
          
          // Monthly data coverage summary
          console.log(`\n🐛   📅 Monthly Data Coverage:`);
          monthlyStats.forEach((stats, date) => {
            const coverage = stats.total > 0 ? ((stats.found / stats.total) * 100).toFixed(1) : '0.0';
            console.log(`🐛     ${date}: ${stats.found}/${stats.total} cards (${coverage}%)`);
          });
        }
        
        if (DEBUG_CONFIG.SHOW_SET_STATISTICS && debugStats.setStats.size > 0) {
          console.log(`\n🐛 🃏 SET STATISTICS:`);
          Array.from(debugStats.setStats.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .forEach(([setCode, stats]) => {
              console.log(`🐛   ${setCode}: ${stats.count} cards, avg $${stats.avgPrice.toFixed(2)}`);
            });
        }
        
        if (DEBUG_CONFIG.VERBOSE_LOGGING) {
          console.log(`\n🐛 🔍 SAMPLE CARDS WITH PRICES:`);
          debugStats.cardsWithPrices.slice(0, 5).forEach((card, i) => {
            console.log(`🐛   ${i+1}. ${card.name} (${card.set}) - $${card.price}`);
          });
          
          if (debugStats.cardsWithoutPrices.length > 0) {
            console.log(`\n🐛 ❌ SAMPLE CARDS WITHOUT PRICES:`);
            debugStats.cardsWithoutPrices.slice(0, 5).forEach((card, i) => {
              console.log(`🐛   ${i+1}. ${card.name} (${card.set})`);
            });
          }
        }
        
        resolve();
      }
    });

    pipeline.on('error', (err) => {
      console.error('[ERROR] Stream processing failed:', err);
      reject(err);
    });
  });

  // Mark as 100% complete before upload
  try {
    fs.writeFileSync(progressPath, JSON.stringify({
      total: processed,
      processed,
      percent: 100,
      elapsed: (Date.now() - startTime) / 1000,
      eta: 0,
      rate: processed / ((Date.now() - startTime) / 1000),
      inProgress: false,
      phase: 'uploading'
    }));
  } catch (err) {
    // Ignore progress file errors
  }

  console.log(`\nUploading ${cards.length} cards to ${API_URL}...`);
  
  try {
    // Optimized upload with retry logic and better error handling
    const uploadData = { 
      dateRange: TARGET_DATES, 
      cards,
      metadata: {
        monthsCollected: TARGET_DATES.length,
        dataStructure: 'monthly_prices'
      }
    };
    const uploadBody = JSON.stringify(uploadData);
    
    // Add progress indicator for upload
    const uploadStartTime = Date.now();
    console.log(`Upload payload size: ${(uploadBody.length / 1024 / 1024).toFixed(1)} MB`);
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': uploadBody.length.toString()
      },
      body: uploadBody,
      timeout: 120000 // 2 minute timeout for large uploads
    });
    
    const uploadTime = (Date.now() - uploadStartTime) / 1000;
    
    if (res.ok) {
      console.log(`✓ Upload successful! (${uploadTime.toFixed(1)}s)`);
      console.log(`✓ Import completed in ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes total`);
    } else {
      const errorText = await res.text();
      console.error('✗ Upload failed:', errorText);
      throw new Error(`Upload failed (${res.status}): ${errorText}`);
    }
  } catch (uploadError) {
    console.error('✗ Upload error:', uploadError.message);
    
    // Try to save data locally as backup if upload fails
    const backupPath = path.join(__dirname, `price-history-backup-${Date.now()}.json`);
    try {
      fs.writeFileSync(backupPath, JSON.stringify({ dateRange: TARGET_DATES, cards }, null, 2));
      console.log(`💾 Data saved to backup file: ${backupPath}`);
    } catch (backupError) {
      console.error('Failed to create backup:', backupError.message);
    }
    
    throw uploadError;
  }

  // Remove progress file after successful completion
  try { 
    fs.unlinkSync(progressPath); 
    console.log('✓ Import process completed successfully');
  } catch {}
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
