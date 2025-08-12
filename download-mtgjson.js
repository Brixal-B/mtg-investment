// Usage: node download-mtgjson.js [AllPrintings|AllPrices].json [output_path]
const https = require('https');
const fs = require('fs');
const path = require('path');

const fileName = process.argv[2] || 'AllPrintings.json';
const outputPath = process.argv[3] || path.join(__dirname, fileName);
const url = `https://mtgjson.com/api/v5/${fileName}`;

function download(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, response => {
    if (response.statusCode !== 200) {
      cb(new Error(`Failed to get '${url}' (${response.statusCode})`));
      return;
    }
    response.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', err => {
    fs.unlink(dest, () => cb(err));
  });
}

if (fs.existsSync(outputPath)) {
  console.log(`${outputPath} already exists. Skipping download.`);
  process.exit(0);
}

console.log(`Downloading ${fileName} from MTGJSON...`);
download(url, outputPath, err => {
  if (err) {
    console.error('Download failed:', err.message);
    process.exit(1);
  } else {
    console.log(`Downloaded to ${outputPath}`);
  }
});
