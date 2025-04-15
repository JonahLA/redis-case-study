import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from './config.js';
import { cleanup } from './cleanup.js';

export const options = {
  stages: CONFIG.stages.checkout,
  thresholds: {
    http_req_duration: ['p95<2000'], // 95% of requests should complete within 2s
    http_req_failed: ['rate<0.01'],  // Less than 1% of requests should fail
  }
};

export function setup() {
  cleanup();
  return { userId: `test-user-${Date.now()}` };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'user-id': data.userId
  };

  // Step 1: Add items to cart
  for (const product of CONFIG.testData.products) {
    const addToCartRes = http.post(
      `${CONFIG.baseUrl}/api/cart/items`,
      JSON.stringify(product),
      { headers }
    );

    check(addToCartRes, {
      'add to cart successful': (r) => r.status === 201,
    });
  }

  // Step 2: Checkout
  const checkoutPayload = {
    shippingAddress: CONFIG.testData.shippingAddress,
    paymentDetails: CONFIG.testData.paymentDetails
  };

  const checkoutRes = http.post(
    `${CONFIG.baseUrl}/api/checkout`,
    JSON.stringify(checkoutPayload),
    { headers }
  );

  check(checkoutRes, {
    'checkout successful': (r) => r.status === 201,
  });

  sleep(1);
}

export function teardown(data) {
  cleanup();
}