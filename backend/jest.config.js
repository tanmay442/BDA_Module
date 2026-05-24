module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFiles: [],
  testMatch: ['**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
