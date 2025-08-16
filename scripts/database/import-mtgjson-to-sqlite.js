// Usage: node import-mtgjson-to-sqlite.js path/to/AllPrintings.json path/to/cards.db
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

if (process.argv.length < 4) {
  console.error('Usage: node import-mtgjson-to-sqlite.js path/to/AllPrintings.json path/to/cards.db');
  process.exit(1);
}

const jsonPath = process.argv[2];
const dbPath = process.argv[3];

console.log('Reading MTGJSON file...');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT,
    setCode TEXT,
    setName TEXT,
    rarity TEXT,
    typeLine TEXT,
    manaCost TEXT,
    cmc REAL,
    oracleText TEXT,
    usd TEXT
  )`);

  const insert = db.prepare(`INSERT OR REPLACE INTO cards (id, name, setCode, setName, rarity, typeLine, manaCost, cmc, oracleText, usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const setCode in data.data) {
    const set = data.data[setCode];
    const setName = set.name;
    for (const card of set.cards) {
      insert.run(
        card.uuid,
        card.name,
        setCode,
        setName,
        card.rarity || '',
        card.type || '',
        card.manaCost || '',
        card.cmc || 0,
        card.text || '',
        card.prices && card.prices.usd ? card.prices.usd : null
      );
    }
  }
  insert.finalize();
  console.log('Import complete!');
});

db.close();
