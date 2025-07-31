module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main.js', // Exclude main.js from coverage as it's the entry point
    '!src/routes/authRoutes.js', // Exclude authRoutes.js from unit test coverage as it's tested via integration
  ],
  modulePaths: [
    '<rootDir>/src'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
};