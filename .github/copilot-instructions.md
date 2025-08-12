# Copilot Instructions for MTG Investment Tracking Application

## Project Domain Context
The MTG Investment Tracking Application is designed to help users track the investment performance of Magic: The Gathering (MTG) cards. It focuses on financial data handling, allowing users to monitor card prices, trends, and investment opportunities.

## Technical Stack Guidance
- **Language**: TypeScript
- **Framework**: Next.js
- **Database Architecture**:
  - Development: SQLite
  - Production: PostgreSQL

## Code Standards
- Maintain backward compatibility with existing interfaces:
  - `MTGCard`
  - `MTGCardPrices`
  - `ProcessedCardPrice`

## Database Guidelines
- Follow the 4-table schema design for optimal organization and accessibility:
  1. `Cards`
  2. `Prices`
  3. `Users`
  4. `Transactions`

## MTG Domain Knowledge
- Familiarize yourself with MTG card terminology, including:
  - Rarity
  - Set
  - Condition
  - Price history

## Development Workflow Patterns
- Follow a structured development approach:
  1. Feature branches for new developments.
  2. Pull requests for code reviews.
  3. Continuous integration for automated testing.

## File Organization
- Utilities should be stored in `src/lib/`
- API endpoints should be placed in `src/pages/api/`

## Error Handling and Logging Standards
- Implement consistent error handling throughout the application.
- Use a logging framework to capture and log errors for troubleshooting.

## Testing Requirements
- Ensure thorough testing of all database operations:
  - Unit tests for individual functions.
  - Integration tests for database interactions.

## Performance Considerations
- Optimize queries for time-series price data to ensure quick response times and reduce load on the database. Consider indexing strategies and query optimization techniques to enhance performance.