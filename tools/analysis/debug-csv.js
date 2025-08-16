// Debug script to test CSV upload functionality
const https = require('https');
const http = require('http');

async function testCardSearch() {
  console.log('🧪 Testing Card Search API...');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3000/api/cards/search?name=Lightning%20Bolt&limit=3', (res) => {
      let data = '';
      
      console.log('📡 Response status:', res.statusCode);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            console.log('✅ API Response:', JSON.stringify(jsonData, null, 2));
          } else {
            console.log('❌ API Error:', res.statusCode, data);
          }
          resolve();
        } catch (error) {
          console.error('💥 JSON Parse Error:', error.message);
          console.log('Raw response:', data);
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 Network Error:', error.message);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timed out');
      req.destroy();
      resolve();
    });
  });
}

async function testDatabaseConnection() {
  console.log('\n🧪 Testing Database Connection...');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3000/api/portfolio', (res) => {
      let data = '';
      
      console.log('� Portfolio API status:', res.statusCode);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            console.log('✅ Portfolio API working');
          } else {
            console.log('❌ Portfolio API Error:', res.statusCode);
          }
          resolve();
        } catch (error) {
          console.error('💥 JSON Parse Error:', error.message);
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('💥 Network Error:', error.message);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timed out');
      req.destroy();
      resolve();
    });
  });
}

async function main() {
  console.log('🔧 CSV Upload Debug Script');
  console.log('=====================================');
  
  await testCardSearch();
  await testDatabaseConnection();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If the APIs are working, test the CSV upload in the browser');
  console.log('2. Open http://localhost:3000/portfolio');
  console.log('3. Click "Import CSV" and upload test-cards.csv');
  console.log('4. Check browser console for debug messages');
}

main().catch(console.error);
