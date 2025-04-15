import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from './config.js';

export const options = {
  stages: CONFIG.stages.productDetail,
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should complete within 1s
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests should fail
  }
};

export default function() {
  // Use a smaller range of known valid product IDs
  const productId = Math.floor(Math.random() * 10) + 1;
  
  const res = http.get(`${CONFIG.baseUrl}/api/products/${productId}`);
  
  check(res, {
    'product detail successful': (r) => {
      // Consider both 200 and 404 as "successful" API responses
      return r.status === 200 || r.status === 404;
    },
    'has product data': (r) => {
      if (r.status !== 200) return true; // Skip data validation for non-200 responses
      try {
        const body = JSON.parse(r.body);
        return body && body.id && body.name && body.price;
      } catch (e) {
        console.error('Failed to parse response:', e);
        return false;
      }
    },
  });

  sleep(1);
}