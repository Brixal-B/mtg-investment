const StreamValues = require('stream-json/streamers/StreamValues');
const fs = require('fs');

let sampleCard = null;
let cardCount = 0;

const pipeline = fs.createReadStream('./public/AllPrices.json')
  .pipe(StreamValues.withParser());

pipeline.on('data', (data) => {
  if (!sampleCard && data.value.prices && data.value.prices.usd) {
    sampleCard = data.value;
    console.log('Sample card:', data.value.name);
    console.log('Available price dates (first 10):', Object.keys(data.value.prices.usd).slice(0, 10));
    console.log('Available price dates (last 10):', Object.keys(data.value.prices.usd).slice(-10));
    console.log('Total price dates:', Object.keys(data.value.prices.usd).length);
    
    // Check for recent dates
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (data.value.prices.usd[dateStr]) {
        console.log(`Found recent price data: ${dateStr} = $${data.value.prices.usd[dateStr]}`);
        break;
      }
    }
    
    pipeline.destroy();
  }
  cardCount++;
  if (cardCount > 1000) {
    console.log('No cards with price data found in first 1000 cards');
    pipeline.destroy();
  }
});

pipeline.on('close', () => {
  console.log('Check complete');
});
