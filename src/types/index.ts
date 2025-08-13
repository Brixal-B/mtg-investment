/**
 * Type Definitions Index
 * Centralized exports for all application types
 */

// MTG and card-related types
export type {
  Card,
  MTGCard,
  MTGCardPrices,
  ProcessedCardPrice,
  PriceSnapshot,
  CardWithPrice,
  CardsphereCSVRow,
  CardFilter,
  CardSearchResult,
} from './mtg';

// Player-focused types
export type {
  CollectionPortfolio,
  PortfolioPerformance,
  TopHolding,
  DiversificationMetrics,
  RecentActivity,
  Deck,
  DeckCard,
  DeckStats,
  MTGFormat,
  WishlistItem,
  PriceAlert,
  MarketTrend,
  TrendSignal,
  CollectionAnalytics,
  CollectionInsight,
  CollectionRecommendation,
  RiskMetrics,
  AdvancedCardFilter,
  UserPreferences,
} from './player';

// API Types
export type {
  AppError,
  ApiError,
  ApiResponse,
  AdminStatus,
  DownloadProgress,
  ImportProgress,
  MTGJSONFileStatus,
  AppConfig,
  DebugConfig,
  AdminAction,
  FileProcessingStatus,
  DatabaseCard,
  PriceRecord,
  CollectionItem,
  DatabasePriceSnapshot,
  ImportLog,
  DatabaseInfo,
  SystemHealthStatus,
  DatabaseHealth,
  PerformanceMetrics,
  FileSystemInfo,
  SecurityStatus,
  ApplicationInfo,
  SystemMetrics
} from './api';

// Component and UI types
export type {
  HomePageState,
  CSVUploadProps,
  CardGridProps,
  CardItemProps,
  FilterBarProps,
  AdminPanelProps,
  ProgressBarProps,
  NavLink,
  DropdownNavProps,
  IndexPageState,
  FormField,
  PriceRangeFilter,
  FileUploadHandler,
  FilterChangeHandler,
  CardClickHandler,
  AdminActionHandler,
} from './components';

// Utility types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Generic API types
export type AsyncOperationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// Date and time types
export type DateString = string; // YYYY-MM-DD format
export type ISODateString = string; // ISO 8601 format
export type UnixTimestamp = number;

// Price types
export type PriceValue = number; // In USD, up to 2 decimal places
export type PriceChange = {
  absolute: number;
  percentage: number;
  period: string;
};

// File types
export type SupportedFileType = 'csv' | 'json';
export type FileSize = number; // in bytes
