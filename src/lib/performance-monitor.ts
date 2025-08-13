/**
 * Performance Monitor - Track and optimize application performance
 */

// Performance metrics interface
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTime: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Core Web Vitals monitoring
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`Performance metric: ${entry.name} = ${entry.duration || 'N/A'}`);
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  // Track page load performance
  trackPageLoad() {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      console.log(`Page load time: ${this.metrics.loadTime}ms`);
    }
  }

  // Track API call performance
  trackApiCall(name: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    this.metrics.apiResponseTime = duration;
    console.log(`API call ${name}: ${duration}ms`);
    
    // Store in cache for analytics
    if (typeof window !== 'undefined') {
      const apiMetrics = JSON.parse(localStorage.getItem('apiMetrics') || '{}');
      apiMetrics[name] = (apiMetrics[name] || []).concat(duration).slice(-10); // Keep last 10
      localStorage.setItem('apiMetrics', JSON.stringify(apiMetrics));
    }
  }

  // Track memory usage
  trackMemoryUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    this.metrics.memoryUsage = memory.usedJSHeapSize;
    console.log(`Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Track cache performance
  trackCacheHitRate(hits: number, total: number) {
    this.metrics.cacheHitRate = (hits / total) * 100;
    console.log(`Cache hit rate: ${this.metrics.cacheHitRate.toFixed(2)}%`);
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Clean up observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance utilities
export const performanceUtils = {
  // Measure function execution time
  measure: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      performanceMonitor.trackApiCall(name, start, end);
      return result;
    } catch (error) {
      const end = performance.now();
      performanceMonitor.trackApiCall(`${name}-error`, start, end);
      throw error;
    }
  },

  // Debounce function for performance
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

  // Throttle function for performance
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

export default performanceMonitor;
