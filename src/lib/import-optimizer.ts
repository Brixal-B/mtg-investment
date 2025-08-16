/**
 * Import Optimizer - Utility for managing efficient imports
 */

// Re-export commonly used types for better tree-shaking
export type {
  MTGCard,
  ProcessedCardPrice,
  PriceSnapshot
} from '../types';

// Re-export commonly used utilities
export {
  formatCurrency,
  calculatePriceChange,
  validateCardData
} from './api-utils';

// Lazy-loaded heavy dependencies
export const getLazyComponents = () => ({
  VirtualizedList: () => import('../components/VirtualizedList'),
  ImageOptimizer: () => import('../components/ImageOptimizer'),
  DiversificationCharts: () => import('../components/portfolio/DiversificationCharts')
});

// Performance utilities
export const performanceUtils = {
  debounce: <T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  throttle: <T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};
