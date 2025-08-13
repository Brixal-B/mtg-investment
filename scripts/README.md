# Utility Scripts

This directory contains utility scripts for data processing and maintenance of the MTG Investment application.

## Scripts

### `check-dates.js`
Utility script to check and validate date formats in the data files.

### `download-mtgjson.js`
Script to download MTGJSON data files from the official MTGJSON API.

### `import-mtgjson-to-sqlite.js`
Converts MTGJSON data format and imports it into SQLite database.

### `load-mtgjson-price-history.js`
Processes MTGJSON price history data and loads it into the application's data format.

### `simple-check.js`
Simple validation script for basic data integrity checks.

## Usage

These scripts are standalone utilities that can be run with Node.js:

```bash
node scripts/script-name.js
```

**Note:** Most of these scripts require MTGJSON data files to be present in the appropriate directories. Refer to the main application documentation for setup instructions.

## Related Files

- `cleanup.js` and `workflow.js` remain in the root directory as they are referenced in package.json scripts
- Configuration files (`postcss.config.js`, `tailwind.config.js`) remain in root as required by their respective frameworks