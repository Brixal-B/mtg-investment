# MTG Investment Next

A Next.js app for managing and analyzing your Magic: The Gathering (MTG) card inventory, with CSV import, price fetching, filtering, and price history features.

## Features

- **Collection Portfolio**: Comprehensive portfolio management with analytics and performance tracking.
- **CSV Import**: Import your collection directly from Cardsphere CSV exports into your portfolio.
- **Intelligent Card Matching**: Automatically matches uploaded cards to the MTGJSON database.
- **Collection Analytics**: Track portfolio value, performance metrics, and diversification.
- **Robust CSV Parsing**: Handles card names with commas/quotes using PapaParse.
- **Card Image & Price Fetching**: Fetches card images and prices from the Scryfall API.
- **Modern UI**: Responsive, dark mode, and filterable card grid.
- **Filters**: Filter by price, card name (with autocomplete), and set (with searchable dropdown).
- **No Price View**: Toggle to see cards missing price data.
- **Total Value**: See the total value of currently visible cards.
- **Price History API**: Backend API for saving and retrieving price snapshots.
- **MTGJSON Integration**: Scripts to download and import MTGJSON data into SQLite for advanced use.
- **🧹 Cleanup Agent**: Automated codebase maintenance with multi-agent workflow support.

## 🤖 Multi-Agent Architecture

This project uses a sophisticated multi-agent refactoring approach:

- **🎯 TypeScript Agent**: Comprehensive type safety foundation
- **🎨 Frontend Agent**: Modular component architecture  
- **🔧 Backend Agent**: Centralized configuration and API modernization
- **🧹 Cleanup Agent**: Automated cleanup after each agent completes

See [CLEANUP_AGENT.md](./CLEANUP_AGENT.md) for detailed cleanup documentation.

### Quick Cleanup Commands
```bash
npm run cleanup:dry      # Preview cleanup
npm run cleanup          # Run cleanup
npm run workflow:final   # Final project cleanup
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install dependencies
```bash
npm install
```

### Run the app in development
```bash
npm run dev
```

### Build and run in production
```bash
npm run build
npm start
```

## CSV Import for Collection Portfolio

The Collection Portfolio features an advanced CSV import system that allows you to quickly build your collection from external tools:

### Supported CSV Formats
- **Cardsphere Export**: Primary support for Cardsphere CSV exports
- **Generic CSV**: Any CSV with Name, Set, Quantity, Condition, Foil, and Price columns

### CSV Import Process
1. Navigate to the Collection Portfolio page (`/portfolio`)
2. Click the "Import CSV" button
3. Upload your CSV file via drag-and-drop or file browser
4. The system will:
   - Parse the CSV data
   - Match card names to the MTGJSON database  
   - Add successfully matched cards to your collection
   - Provide a summary of matches/mismatches
   - Allow download of unmatched cards for review

### CSV Column Mapping
The importer recognizes the following column names (case-insensitive):
- **Name** / **name**: Card name (required)
- **Set** / **set**: Set code (e.g., "LEA", "ICE")
- **Set Name** / **set_name**: Full set name
- **Quantity** / **quantity**: Number of copies (default: 1)
- **Condition** / **condition**: Card condition (default: "Near Mint")
- **Foil** / **foil**: Whether the card is foil (true/false)
- **Price** / **price**: Purchase price (optional)

### Condition Mapping
The system maps various condition formats to standardized values:
- `M`, `Mint` → `mint`
- `NM`, `Near Mint` → `near_mint`
- `LP`, `Lightly Played` → `light_played`
- `MP`, `Moderately Played` → `played`
- `HP`, `Heavily Played`, `D`, `Damaged` → `poor`

## Original CSV Import (Legacy)
- The original CSV viewer is still available on the main page
- Export your inventory from Cardsphere as a CSV.
- Upload the CSV using the app's UI.
- The app will parse the file, fetch images/prices, and display your collection.

## Filtering & Search
- Filter by price range, card name (with autocomplete), and set (with dropdown).
- Toggle to view only cards missing price data.
- The total value updates based on current filters.

## Price History API
- API endpoint: `/api/price-history`
- `GET` returns all price snapshots.
- `POST` with `{ date, cards }` saves a new snapshot.
- Snapshots are stored in `/tmp/price-history.json` (file-based, for prototyping).

## MTGJSON Integration
- `scripts/download-mtgjson.js`: Downloads the latest MTGJSON file (e.g., AllPrintings.json).
- `scripts/import-mtgjson-to-sqlite.js`: Imports MTGJSON data into a SQLite database for advanced querying.
- Additional utility scripts in `scripts/` directory for data processing and validation.

### Example usage:
```bash
node scripts/download-mtgjson.js AllPrintings.json ./AllPrintings.json
node scripts/import-mtgjson-to-sqlite.js ./AllPrintings.json ./cards.db
```

See [`scripts/README.md`](./scripts/README.md) for complete script documentation.

## Customization
- You can extend the backend to use a real database (PostgreSQL, MongoDB, etc.) for persistent, multi-user price history.
- The UI can be further customized for more advanced analytics, charts, or export features.

## Development Notes
- Uses PapaParse for robust CSV parsing.
- Uses Scryfall API for card data.
- SQLite scripts are for prototyping and local analysis.

## License
MIT
