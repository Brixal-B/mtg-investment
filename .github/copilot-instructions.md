# GitHub Copilot Instructions for MTG Investment Repository

## Project Overview

This is an MTG (Magic: The Gathering) investment tracking application built with TypeScript and Next.js that helps users track card prices and investment performance. The application integrates with multiple data sources and is currently transitioning from file-based storage to a database architecture.

### Core Functionality
- Track MTG card prices and investment performance over time
- Import collection data from Cardsphere CSV files
- Integrate with Scryfall API and MTGJSON data sources
- Provide price history analysis and filtering capabilities
- Support multiple card formats and pricing sources

## Technical Stack & Architecture

### Primary Technologies
- **Frontend**: Next.js 15.4.6 with React 19.1.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with responsive design
- **Data Sources**: Scryfall API, MTGJSON, Cardsphere CSV imports
- **Current Storage**: File-based system in transition to database
- **Target Database**: SQLite for development, PostgreSQL for production

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── admin/         # Administrative functions
│   │   ├── mtgjson-data/  # MTGJSON data management
│   │   ├── price-history/ # Price tracking endpoints
│   │   └── test-json/     # Development utilities
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main application page
├── components/            # React components
├── lib/                  # Utility libraries
│   ├── config.ts         # Centralized configuration
│   ├── api-utils.ts      # API helper functions
│   ├── filesystem.ts     # File system operations
│   └── errors.ts         # Error handling utilities
├── types/                # TypeScript type definitions
│   ├── mtg.ts           # Core MTG card types
│   ├── api.ts           # API response types
│   └── components.ts    # Component prop types
├── services/            # Business logic services
└── utils/               # General utilities
```

## Core Type Definitions (MUST PRESERVE)

### Essential MTG Types
The following type definitions are critical to the application and must be preserved exactly:

```typescript
// Core card interface
interface MTGCard {
  uuid: string;
  name: string;
  setCode: string;
  setName: string;
  rarity?: string;
  typeLine?: string;
  manaCost?: string;
  cmc?: number;
  oracleText?: string;
  imageUrl?: string;
  prices?: MTGCardPrices;
}

// MTGJSON price structure
interface MTGCardPrices {
  paper?: {
    tcgplayer?: {
      retail?: {
        normal?: Record<string, number>;
        foil?: Record<string, number>;
      };
    };
    cardkingdom?: {
      retail?: {
        normal?: Record<string, number>;
        foil?: Record<string, number>;
      };
    };
  };
  mtgo?: Record<string, number>;
  mtgoFoil?: Record<string, number>;
}

// Processed price data for application use
interface ProcessedCardPrice {
  uuid: string;
  prices: Record<string, number>; // date -> price (YYYY-MM-DD format)
}
```

### API Contract Preservation
All existing API endpoints must maintain backward compatibility:
- `/api/admin/*` - Administrative functions
- `/api/mtgjson-data` - Card data retrieval
- `/api/price-history` - Price tracking operations
- `/api/test-json` - Development utilities

## MTG Domain Knowledge

### Card Terminology
- **Set**: A collection of cards released together (e.g., "Foundations", "Duskmourn")
- **Rarity**: Common, Uncommon, Rare, Mythic Rare, Special rarities
- **Foil**: Premium card with special finish, typically worth more
- **Format**: Playing formats like Standard, Modern, Legacy, Commander
- **Oracle Text**: The official rules text of a card
- **CMC (Converted Mana Cost)**: The total cost to cast a spell
- **Type Line**: Card type (e.g., "Creature — Human Wizard")

### Pricing Sources
- **TCGPlayer**: Primary marketplace for pricing data
- **Card Kingdom**: Alternative pricing source
- **MTGO**: Magic: The Gathering Online digital prices
- **Scryfall**: API for card images and metadata

### Investment Considerations
- Price volatility is common, especially around set releases
- Foil premiums vary significantly by card and set
- Format legality affects card values
- Reprints typically decrease card values
- Tournament results can spike card prices

## Database Architecture Guidelines

### Schema Design (Target State)
The application is transitioning to a database with this core schema:

```sql
-- Core tables for the database transition
cards (
  uuid PRIMARY KEY,
  name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  set_name TEXT,
  rarity TEXT,
  type_line TEXT,
  mana_cost TEXT,
  cmc INTEGER,
  oracle_text TEXT
);

price_history (
  id SERIAL PRIMARY KEY,
  card_uuid TEXT REFERENCES cards(uuid),
  date DATE NOT NULL,
  price_usd DECIMAL(10,2),
  source TEXT,
  foil BOOLEAN DEFAULT FALSE
);

card_sets (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  release_date DATE,
  type TEXT
);

import_logs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  records_processed INTEGER,
  status TEXT
);
```

### Migration Strategy
- Maintain file-based storage compatibility during transition
- Implement dual-read/write system for gradual migration
- Preserve all existing data during transition
- Use transactions for data consistency
- Include rollback mechanisms for safety

## Code Standards & Patterns

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper generic constraints for utility functions
- Avoid `any` type - use unknown or proper typing
- Include comprehensive JSDoc comments for complex logic

### Next.js Patterns
- Use App Router conventions (not Pages Router)
- Implement proper error boundaries
- Use Server Components by default, Client Components when needed
- Follow Next.js caching and revalidation patterns
- Implement proper loading states and error handling

### Error Handling
- Use the existing error utility classes in `src/lib/errors.ts`
- Implement proper HTTP status codes for API responses
- Include detailed error messages for debugging
- Log errors appropriately for production monitoring
- Provide user-friendly error messages in UI

### Configuration Management
- Use `src/lib/config.ts` for all environment-specific settings
- Support both development and production configurations
- Include proper validation for configuration values
- Use environment variables for sensitive data
- Document configuration options clearly

## API Development Guidelines

### Request/Response Patterns
- Follow RESTful conventions where appropriate
- Use consistent response formats across endpoints
- Include proper status codes and error messages
- Implement rate limiting for external API calls
- Support pagination for large datasets

### Data Validation
- Validate all input data using TypeScript interfaces
- Sanitize user inputs to prevent injection attacks
- Implement proper file upload validation
- Use schema validation for complex payloads
- Return detailed validation errors

### Performance Considerations
- Implement caching for expensive operations
- Use batch processing for large datasets
- Optimize database queries with proper indexing
- Monitor API response times
- Implement request timeouts and retries

## Development Workflow

### File Organization
- Place utility functions in `src/lib/`
- Keep API routes in `src/app/api/`
- Use barrel exports in `src/types/index.ts`
- Organize components by feature when possible
- Maintain clear separation of concerns

### Testing Guidelines
- Write unit tests for all utility functions
- Test API endpoints with various input scenarios
- Include integration tests for database operations
- Test error conditions and edge cases
- Maintain test coverage for critical paths

### Database Operations
- Use migrations for all schema changes
- Include proper indexing for performance
- Implement connection pooling for production
- Use transactions for multi-table operations
- Include data validation at the database level

### CSV Import Handling
- Support Cardsphere CSV format specifications
- Handle special characters in card names properly
- Validate CSV structure before processing
- Provide progress feedback for large imports
- Include error handling for malformed data

## Performance & Optimization

### Data Processing
- Process large datasets in batches (use `PROCESSING.BATCH_SIZE`)
- Implement progress tracking for long-running operations
- Use streaming for large file processing
- Clean up memory periodically during bulk operations
- Monitor and limit resource usage

### Caching Strategy
- Cache frequently accessed card data
- Implement price data caching with TTL
- Use Next.js built-in caching mechanisms
- Cache API responses appropriately
- Invalidate cache when data changes

### File System Operations
- Use the centralized paths from `src/lib/config.ts`
- Implement proper file locking for concurrent access
- Handle file system errors gracefully
- Clean up temporary files after processing
- Use appropriate file permissions

## Security Considerations

### Data Protection
- Sanitize all user inputs
- Validate file uploads thoroughly
- Use HTTPS for all external API calls
- Implement proper access controls for admin functions
- Log security-related events

### API Security
- Implement rate limiting on public endpoints
- Validate all request parameters
- Use proper CORS configuration
- Sanitize error messages in production
- Monitor for suspicious activity patterns

## Integration Guidelines

### External APIs
- Follow Scryfall API guidelines and rate limits
- Handle API failures gracefully with retries
- Cache API responses to reduce external calls
- Include proper error handling for network issues
- Monitor API usage and costs

### MTGJSON Integration
- Follow MTGJSON data structure conventions
- Handle large file downloads efficiently
- Validate MTGJSON data integrity
- Update data sources regularly
- Parse JSON streams for memory efficiency

## Troubleshooting & Debugging

### Common Issues
- Memory issues with large MTGJSON files - use streaming
- Network timeouts with external APIs - implement retries
- File locking issues during imports - check for stale locks
- Database connection issues - implement connection pooling
- Type errors - ensure proper TypeScript configuration

### Debugging Tools
- Use structured logging with appropriate levels
- Include request IDs for API call tracing
- Monitor file system operations
- Track database query performance
- Log import progress and errors

## Future Considerations

### Scalability Planning
- Design for horizontal scaling with database
- Consider CDN for card images
- Plan for multiple concurrent users
- Implement proper session management
- Design for microservices if needed

### Feature Extensions
- Support for additional pricing sources
- Enhanced price prediction algorithms
- Portfolio management features
- Multi-user support with authentication
- Real-time price alerts and notifications

Remember: This application handles financial data for investment tracking. Accuracy, data integrity, and performance are critical. Always test thoroughly, especially when working with price data or database operations.