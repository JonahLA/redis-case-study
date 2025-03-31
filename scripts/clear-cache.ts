import { clearCache } from '../src/lib/redis';

// Get pattern from command line args or use default
const pattern = process.argv[2] || '*';

async function clearCacheAndExit() {
  try {
    console.log(`Clearing cache with pattern: ${pattern}`);
    const count = await clearCache(pattern);
    console.log(`Successfully cleared ${count} keys from Redis cache`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCacheAndExit();
