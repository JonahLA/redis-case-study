export const CONFIG = {
  baseUrl: 'http://localhost:7090',
  stages: {
    checkout: [
      { duration: '30s', target: 100 },  // Ramp up
      { duration: '1m', target: 2000 },  // Spike to 2000 users
      { duration: '30s', target: 0 },    // Ramp down
    ],
    productDetail: [
      { duration: '30s', target: 100 },  // Ramp up
      { duration: '1m', target: 2000 },  // Spike to 2000 users
      { duration: '30s', target: 0 },    // Ramp down
    ]
  },
  testData: {
    products: [
      { id: 1, quantity: 2 },
      { id: 2, quantity: 1 },
      { id: 3, quantity: 1 }
    ],
    shippingAddress: {
      name: "Test User",
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      country: "Test Country"
    },
    paymentDetails: {
      method: 'credit_card',
      status: 'success'
    }
  }
};