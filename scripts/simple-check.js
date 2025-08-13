const fs = require('fs');

// Simple check to see what a card looks like
const data = fs.readFileSync('./public/AllPrices.json', 'utf8');
const parsed = JSON.parse(data);

console.log('Data structure:');
const firstKey = Object.keys(parsed.data)[0];
const firstCard = parsed.data[firstKey];

console.log('First card name:', firstCard.name);
console.log('Has prices?', !!firstCard.prices);
if (firstCard.prices && firstCard.prices.usd) {
  const dates = Object.keys(firstCard.prices.usd);
  console.log('Price dates count:', dates.length);
  console.log('First 5 dates:', dates.slice(0, 5));
  console.log('Last 5 dates:', dates.slice(-5));
  
  // Look for recent dates
  console.log('Recent price samples:');
  dates.slice(-10).forEach(date => {
    console.log(`  ${date}: $${firstCard.prices.usd[date]}`);
  });
}
