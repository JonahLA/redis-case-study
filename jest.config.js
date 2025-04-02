module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  forceExit: true, // Add this to ensure Jest exits even if there are pending handles
  testTimeout: 10000, // Increased timeout
};
