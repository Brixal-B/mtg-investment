# MTG Investment Next

A Next.js app for managing and analyzing your Magic: The Gathering (MTG) card inventory, with CSV import, price fetching, filtering, and price history features.

## Features

- **CSV Upload**: Import your collection from a Cardsphere CSV file.
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

## CSV Import
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
- `download-mtgjson.js`: Downloads the latest MTGJSON file (e.g., AllPrintings.json).
- `import-mtgjson-to-sqlite.js`: Imports MTGJSON data into a SQLite database for advanced querying.

### Example usage:
```bash
node download-mtgjson.js AllPrintings.json ./AllPrintings.json
node import-mtgjson-to-sqlite.js ./AllPrintings.json ./cards.db
```

## Customization
- You can extend the backend to use a real database (PostgreSQL, MongoDB, etc.) for persistent, multi-user price history.
- The UI can be further customized for more advanced analytics, charts, or export features.

## Development Notes
- Uses PapaParse for robust CSV parsing.
- Uses Scryfall API for card data.
- SQLite scripts are for prototyping and local analysis.

## License
MIT
