/**
 * React Component Props and UI State Types
 */

import { Card, CardWithPrice, CardFilter, MTGCard } from './mtg';
import type { AdminStatus, DownloadProgress, ImportProgress } from './index';

// CSV data structure
export interface CSVRow {
  [key: string]: string | number | undefined;
  // Common CSV columns from Cardsphere exports
  name?: string;
  set?: string;
  set_name?: string;
  price?: string | number;
  quantity?: string | number;
}

// Main page component state
export interface HomePageState {
  // Admin panel state
  adminStatus: string;
  adminLoading: boolean;
  downloadProgress: number | null;
  downloadSpeed: string | null;
  
  // Import state
  importProgress: number | null;
  importPhase: string | null;
  importRate: number | null;
  importEta: number | null;
  importProcessed: number | null;
  importTotal: number | null;
  
  // Card management state
  cards: Card[];
  filteredCards: Card[];
  selectedFile: File | null;
  csvData: CSVRow[] | null;
  
  // Filter state
  filters: CardFilter;
  
  // UI state
  showNoPriceOnly: boolean;
  totalValue: number;
  loading: boolean;
  error: string | null;
}

// Props for individual components (to be created)
export interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  onDataParsed: (data: CSVRow[]) => void;
  loading: boolean;
  error?: string;
}

export interface CardGridProps {
  cards: CardWithPrice[];
  loading: boolean;
  onCardClick?: (card: CardWithPrice) => void;
  showPriceOnly?: boolean;
}

export interface CardItemProps {
  card: CardWithPrice;
  onClick?: () => void;
  showPrice?: boolean;
}

export interface FilterBarProps {
  filters: CardFilter;
  onFiltersChange: (filters: CardFilter) => void;
  totalCards: number;
  filteredCards: number;
  totalValue: number;
}

export interface AdminPanelProps {
  status: AdminStatus;
  downloadProgress: DownloadProgress | null;
  importProgress: ImportProgress | null;
  onDownloadMTGJSON: () => void;
  onImportMTGJSON: () => void;
  onClearImportLock: () => void;
  onViewImportLog: () => void;
}

export interface ProgressBarProps {
  progress: number;
  speed?: string;
  eta?: number;
  phase?: string;
  label?: string;
}

// Navigation component props
export interface NavLink {
  href: string;
  label: string;
}

export interface DropdownNavProps {
  links: NavLink[];
  currentPath?: string;
}

// Index page state
export interface IndexPageState {
  index: MTGCard[];
  loading: boolean;
  loadingProgress: number;
  loadingPhase: string;
  error: string | null;
  filters: {
    search: string;
    setFilter: string;
    minPrice: string;
    maxPrice: string;
  };
}

// Form field types for better type safety
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
}

export interface PriceRangeFilter {
  min: FormField<number>;
  max: FormField<number>;
}

// Event handler types
export type FileUploadHandler = (file: File) => void;
export type FilterChangeHandler = (filters: CardFilter) => void;
export type CardClickHandler = (card: CardWithPrice) => void;
export type AdminActionHandler = (action: string) => Promise<void>;
