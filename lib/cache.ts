type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  createdAt: number;
};

type CacheOptions = {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
};

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessTimes = new Map<string, number>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions) {
    this.options = {
      ttl: options.ttl,
      maxSize: options.maxSize ?? 1000,
    };
  }

  set(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.options.ttl;
    
    // Clean expired entries before adding new one
    this.cleanExpired();
    
    // If we're at max size, remove least recently accessed item
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      createdAt: now,
    });
    
    this.accessTimes.set(key, now);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, now);
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  stats() {
    this.cleanExpired();
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        createdAt: new Date(entry.createdAt),
        expiresAt: new Date(entry.expiresAt),
        age: Date.now() - entry.createdAt,
        ttl: entry.expiresAt - entry.createdAt,
      })),
    };
  }

  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, accessTime] of this.accessTimes.entries()) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }
}

// Create cache instances for different types of data
export const bootstrapCache = new MemoryCache<any>({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 10,
});

export const fixturesCache = new MemoryCache<any>({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 10,
});

export const liveCache = new MemoryCache<any>({
  ttl: 60 * 1000, // 1 minute
  maxSize: 50,
});

export const standingsCache = new MemoryCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
});

export const entryCache = new MemoryCache<any>({
  ttl: 60 * 1000, // 1 minute for live data
  maxSize: 500,
});

export const elementSummaryCache = new MemoryCache<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 200,
});

// Cache wrapper function for async operations
export async function withCache<T>(
  cache: MemoryCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  customTtl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  cache.set(key, data, customTtl);
  
  return data;
}

// Cache key builders
export const cacheKeys = {
  bootstrap: () => 'bootstrap-static',
  fixtures: () => 'fixtures',
  liveGw: (gw: number) => `live-gw-${gw}`,
  standings: (leagueId: number, page: number = 1) => `standings-${leagueId}-${page}`,
  entry: (entryId: number) => `entry-${entryId}`,
  entryHistory: (entryId: number) => `entry-history-${entryId}`,
  entryEvent: (entryId: number, gw: number) => `entry-event-${entryId}-${gw}`,
  entryTransfers: (entryId: number) => `entry-transfers-${entryId}`,
  elementSummary: (playerId: number) => `element-summary-${playerId}`,
  calculated: (type: string, params: string) => `calc-${type}-${params}`,
};

// Utility to clear related caches
export function clearCachesByPattern(pattern: string): void {
  const caches = [
    bootstrapCache,
    fixturesCache,
    liveCache,
    standingsCache,
    entryCache,
    elementSummaryCache,
  ];

  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  });
}

// Global cache statistics
export function getCacheStats() {
  return {
    bootstrap: bootstrapCache.stats(),
    fixtures: fixturesCache.stats(),
    live: liveCache.stats(),
    standings: standingsCache.stats(),
    entry: entryCache.stats(),
    elementSummary: elementSummaryCache.stats(),
  };
}

// Cache warming utilities
export async function warmCache() {
  console.log('Warming caches...');
  
  try {
    // Warm bootstrap cache
    await fetch('/api/fpl/bootstrap');
    
    // Warm fixtures cache
    await fetch('/api/fpl/fixtures');
    
    console.log('Cache warming completed');
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

// Automatic cache cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs: number = 5 * 60 * 1000) { // 5 minutes
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    const caches = [
      bootstrapCache,
      fixturesCache,
      liveCache,
      standingsCache,
      entryCache,
      elementSummaryCache,
    ];
    
    let totalCleaned = 0;
    caches.forEach(cache => {
      const sizeBefore = cache.size();
      // Trigger cleanup by calling size() which internally calls cleanExpired()
      cache.size();
      const sizeAfter = cache.size();
      totalCleaned += sizeBefore - sizeAfter;
    });
    
    if (totalCleaned > 0) {
      console.log(`Cache cleanup: removed ${totalCleaned} expired entries`);
    }
  }, intervalMs);
}

export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup automatically
if (typeof window === 'undefined') {
  // Only run on server
  startCacheCleanup();
}
