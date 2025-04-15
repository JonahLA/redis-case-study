import { CONFIG } from './config.js';
import http from 'k6/http';

export function cleanup() {
  const headers = {
    'Content-Type': 'application/json',
    'user-id': `test-user-${Date.now()}`
  };

  // Clear any existing test cart
  http.del(`${CONFIG.baseUrl}/api/cart`, null, { headers });
  
  // Note: In a real implementation, we might want to:
  // 1. Reset test user data
  // 2. Reset inventory levels
  // 3. Clean up test orders
  // However, for our baseline testing, we'll keep it simple
}

export default function() {
  cleanup();
}