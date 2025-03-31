import Redis, { Redis as RedisClient } from 'ioredis';

// Redis client options interface
interface RedisOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  reconnectStrategy?: (retries: number) => number | void;
}

// Cache operation options
export interface SetOptions {
  ex?: number; // Expiry in seconds
  nx?: boolean; // Only set if key does not exist
  xx?: boolean; // Only set if key exists
}

// Create global variable for Redis client to handle hot-reloading in development
declare global {
  var redisClient: RedisClient | undefined;
}

/**
 * Configure Redis client options from environment variables or defaults
 */
function getRedisOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;
  
  // If Redis URL is provided, use it directly
  if (redisUrl) {
    return { url: redisUrl };
  }
  
  // Otherwise, construct from individual parameters
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    reconnectStrategy: (retries) => {
      // Maximum reconnect delay is 30 seconds
      return Math.min(retries * 1000, 30000);
    }
  };
}

/**
 * Create and configure a Redis client instance
 */
function createRedisClient(): RedisClient {
  const options = getRedisOptions();
  const client = new Redis(options);
  
  // Set up event listeners
  client.on('connect', () => {
    console.log('Redis client connected');
  });
  
  client.on('error', (err) => {
    console.error('Redis client error:', err);
  });
  
  client.on('reconnecting', (delay: number) => {
    console.log(`Redis client reconnecting in ${delay}ms`);
  });
  
  return client;
}

// Initialize Redis client
const redis = global.redisClient || createRedisClient();

// Save Redis client in global variable to prevent multiple instances in development
if (process.env.NODE_ENV === 'development') {
  global.redisClient = redis;
}

export default redis;

/**
 * Check if Redis connection is established
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    // Use PING command to check connection
    const response = await redis.ping();
    return response === 'PONG';
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    // Force disconnect on error
    redis.disconnect();
  }
}

/**
 * Set a value with optional expiry
 */
export async function setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<string> {
  return redis.set(key, value, 'EX', ttlSeconds);
}

/**
 * Get a value if it exists, otherwise fetch it, store it and return it
 */
export async function getOrSet(
  key: string, 
  fetchFn: () => Promise<string>, 
  ttlSeconds: number
): Promise<string> {
  // Try to get the value from cache first
  const cachedValue = await redis.get(key);
  
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  // If not found, fetch the value
  const value = await fetchFn();
  
  // Store in cache with expiry
  await setWithExpiry(key, value, ttlSeconds);
  
  return value;
}

/**
 * Clear all keys matching a pattern (use with caution)
 */
export async function clearCache(pattern: string = '*'): Promise<number> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    return await redis.del(...keys);
  }
  return 0;
}

/**
 * Set a hash field value
 */
export async function hsetValue(key: string, field: string, value: string): Promise<number> {
  return redis.hset(key, field, value);
}

/**
 * Get a hash field value
 */
export async function hgetValue(key: string, field: string): Promise<string | null> {
  return redis.hget(key, field);
}

/**
 * Get all hash fields and values
 */
export async function hgetallValues(key: string): Promise<Record<string, string>> {
  return redis.hgetall(key);
}

/**
 * Check if Redis client is connected
 */
export function isConnected(): boolean {
  return redis.status === 'ready';
}
