# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive branching strategy with GitFlow methodology
- Branch protection rules and validation workflows
- Developer guide for Git workflow
- Automated branch cleanup and management
- Pull request templates for different branch types

### Changed
- Restructured project to follow Next.js best practices
- Enhanced CI/CD pipeline to support multiple branch types

### Security
- Added security scanning for all release branches
- Implemented branch protection rules

## [0.1.0] - 2024-08-14

### Added
- Initial MTG Investment tracking application
- SQLite database with 4-table schema (Cards, Prices, Users, Transactions)
- Price history tracking for MTG cards
- User authentication system
- Basic portfolio management
- Multi-agent refactoring infrastructure

### Technical
- Next.js 15 application structure
- TypeScript throughout the codebase
- Performance optimizations with caching
- Security hardening with JWT authentication
- Testing infrastructure with Jest and Playwright

---

## Release Types

### Major Version (X.0.0)
Breaking changes that require migration or significant updates to how users interact with the application.

### Minor Version (X.Y.0)
New features and enhancements that are backward compatible.

### Patch Version (X.Y.Z)
Bug fixes and small improvements that don't change functionality.

## Categories

### Added
New features and capabilities.

### Changed
Changes in existing functionality.

### Deprecated
Soon-to-be removed features.

### Removed
Features that have been removed.

### Fixed
Bug fixes.

### Security
Security-related improvements and fixes.

### Performance
Performance improvements and optimizations.

### Technical
Internal technical changes, refactoring, dependency updates.

## MTG Investment Specific Categories

### Cards
Changes related to card data handling and management.

### Prices
Updates to price tracking and historical data.

### Portfolio
Changes to portfolio management features.

### Investment
Updates to investment tracking and analytics.

### Database
Database schema changes and migrations.