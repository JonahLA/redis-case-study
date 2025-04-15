import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from './config.js';

export const options = {
  stages: CONFIG.stages.productDetail,
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests should complete within 2s
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests should fail
  }
};

export default function() {
  // Use a larger range of product IDs (1-100) since we've seeded the database
  const productId = Math.floor(Math.random() * 100) + 1;
  
  const res = http.get(`${CONFIG.baseUrl}/api/products/${productId}`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has valid product data': (r) => {
      if (r.status !== 200) return true; // Skip data validation for non-200 responses
      try {
        const body = JSON.parse(r.body);
        return (
          body && 
          typeof body.id === 'number' &&
          typeof body.name === 'string' &&
          typeof body.price === 'number' &&
          body.price > 0
        );
      } catch (e) {
        console.error('Failed to parse response:', e);
        return false;
      }
    },
  });

  sleep(1);
}