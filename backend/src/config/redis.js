const Redis = require('ioredis');

// In-memory fallback cache with TTL for local setups without an active Redis daemon
class InMemoryCache {
  constructor() {
    this.store = new Map();
    console.log('[Cache] Initialized In-Memory fallback cache with TTL support.');
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, duration) {
    let ttlMs = 0;
    if (mode === 'EX' && duration) {
      ttlMs = duration * 1000;
    }
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : Infinity;
    this.store.set(key, { value: typeof value === 'string' ? value : JSON.stringify(value), expiresAt });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async delPattern(pattern) {
    let count = 0;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async flushall() {
    this.store.clear();
    return 'OK';
  }
}

let redisClient = null;
let isRedisConnected = false;
const fallbackCache = new InMemoryCache();

try {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  redisClient = new Redis({
    host,
    port,
    password,
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) return null; // stop reconnect spam if Redis is offline
      return Math.min(times * 500, 2000);
    },
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log(`[Redis] Connected successfully to Redis server at ${host}:${port}`);
  }).catch((err) => {
    isRedisConnected = false;
    console.log(`[Redis] Notice: Redis server is offline (${err.message}). Using high-performance in-memory TTL cache fallback.`);
  });

  redisClient.on('error', (err) => {
    if (isRedisConnected) {
      console.warn('[Redis] Connection lost:', err.message);
    }
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Reconnected to Redis server.');
  });
} catch (err) {
  isRedisConnected = false;
  console.log('[Redis] Initializing in-memory TTL cache fallback.');
}

// Unified Cache Service API
const cacheService = {
  isConnected: () => isRedisConnected,

  async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        const data = await redisClient.get(key);
        return data;
      } catch (err) {
        console.warn(`[Redis] Get failed for ${key}, falling back to memory:`, err.message);
      }
    }
    return await fallbackCache.get(key);
  },

  async set(key, value, ttlSeconds) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    if (isRedisConnected && redisClient) {
      try {
        if (ttlSeconds) {
          return await redisClient.set(key, strVal, 'EX', ttlSeconds);
        }
        return await redisClient.set(key, strVal);
      } catch (err) {
        console.warn(`[Redis] Set failed for ${key}, using memory fallback:`, err.message);
      }
    }
    return await fallbackCache.set(key, strVal, 'EX', ttlSeconds);
  },

  async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {
        console.warn(`[Redis] Del failed for ${key}:`, err.message);
      }
    }
    return await fallbackCache.del(key);
  },

  async delPattern(pattern) {
    let clearedCount = 0;
    if (isRedisConnected && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          clearedCount = await redisClient.del(...keys);
        }
      } catch (err) {
        console.warn(`[Redis] delPattern failed for ${pattern}:`, err.message);
      }
    }
    const memCount = await fallbackCache.delPattern(pattern);
    return clearedCount || memCount;
  },

  async flush() {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.flushall();
      } catch (err) {}
    }
    return await fallbackCache.flushall();
  },
};

module.exports = cacheService;
