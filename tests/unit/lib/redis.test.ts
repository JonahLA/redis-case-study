// Mock Redis client
jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    status: 'ready'
  }));
  return RedisMock;
});

import redis, { 
  checkRedisConnection,
  disconnectRedis,
  setWithExpiry,
  getOrSet,
  clearCache,
  hsetValue,
  hgetValue,
  hgetallValues,
  isConnected
} from '../../../src/lib/redis';

describe('Redis Client', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check Redis connection successfully', async () => {
    // Act
    const isConnected = await checkRedisConnection();
    
    // Assert
    expect(isConnected).toBe(true);
    expect(redis.ping).toHaveBeenCalled();
  });

  it('should report connection status', () => {
    // Act
    const connectionStatus = isConnected();
    
    // Assert
    expect(connectionStatus).toBe(true);
  });

  it('should disconnect Redis client gracefully', async () => {
    // Act
    await disconnectRedis();
    
    // Assert
    expect(redis.quit).toHaveBeenCalled();
  });

  it('should set value with expiry', async () => {
    // Arrange
    const key = 'test-key';
    const value = 'test-value';
    const ttl = 3600;
    
    // Act
    await setWithExpiry(key, value, ttl);
    
    // Assert
    expect(redis.set).toHaveBeenCalledWith(key, value, 'EX', ttl);
  });

  it('should fetch and cache value on cache miss', async () => {
    // Arrange
    const key = 'test-key';
    const value = 'fetched-value';
    const ttl = 3600;
    const fetchFn = jest.fn().mockResolvedValue(value);
    
    // Mock cache miss
    (redis.get as jest.Mock).mockResolvedValue(null);
    
    // Act
    const result = await getOrSet(key, fetchFn, ttl);
    
    // Assert
    expect(result).toBe(value);
    expect(redis.get).toHaveBeenCalledWith(key);
    expect(fetchFn).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalledWith(key, value, 'EX', ttl);
  });

  it('should return cached value on cache hit', async () => {
    // Arrange
    const key = 'test-key';
    const cachedValue = 'cached-value';
    const ttl = 3600;
    const fetchFn = jest.fn().mockResolvedValue('fetched-value');
    
    // Mock cache hit
    (redis.get as jest.Mock).mockResolvedValue(cachedValue);
    
    // Act
    const result = await getOrSet(key, fetchFn, ttl);
    
    // Assert
    expect(result).toBe(cachedValue);
    expect(redis.get).toHaveBeenCalledWith(key);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should clear cache matching a pattern', async () => {
    // Arrange
    const pattern = 'test:*';
    const keys = ['test:1', 'test:2'];
    
    // Mock keys and del
    (redis.keys as jest.Mock).mockResolvedValue(keys);
    
    // Act
    await clearCache(pattern);
    
    // Assert
    expect(redis.keys).toHaveBeenCalledWith(pattern);
    expect(redis.del).toHaveBeenCalledWith(...keys);
  });

  it('should handle empty keys when clearing cache', async () => {
    // Arrange
    const pattern = 'test:*';
    
    // Mock empty keys
    (redis.keys as jest.Mock).mockResolvedValue([]);
    
    // Act
    const result = await clearCache(pattern);
    
    // Assert
    expect(redis.keys).toHaveBeenCalledWith(pattern);
    expect(redis.del).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  // Tests for hash operations
  it('should set hash field value', async () => {
    // Arrange
    const key = 'test-hash';
    const field = 'test-field';
    const value = 'test-value';
    
    // Mock hset response
    (redis.hset as jest.Mock).mockResolvedValue(1);
    
    // Act
    const result = await hsetValue(key, field, value);
    
    // Assert
    expect(result).toBe(1);
    expect(redis.hset).toHaveBeenCalledWith(key, field, value);
  });

  it('should get hash field value', async () => {
    // Arrange
    const key = 'test-hash';
    const field = 'test-field';
    const value = 'test-value';
    
    // Mock hget response
    (redis.hget as jest.Mock).mockResolvedValue(value);
    
    // Act
    const result = await hgetValue(key, field);
    
    // Assert
    expect(result).toBe(value);
    expect(redis.hget).toHaveBeenCalledWith(key, field);
  });

  it('should get all hash fields and values', async () => {
    // Arrange
    const key = 'test-hash';
    const hash = {
      field1: 'value1',
      field2: 'value2'
    };
    
    // Mock hgetall response
    (redis.hgetall as jest.Mock).mockResolvedValue(hash);
    
    // Act
    const result = await hgetallValues(key);
    
    // Assert
    expect(result).toEqual(hash);
    expect(redis.hgetall).toHaveBeenCalledWith(key);
  });
});
