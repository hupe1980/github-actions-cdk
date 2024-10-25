module.exports = {
    preset: 'ts-jest', // Use ts-jest preset for TypeScript
    testEnvironment: 'node', // Use Node environment
    roots: ['<rootDir>/tests'], // Specify the folder where tests are located
    transform: {
      '^.+\\.tsx?$': 'ts-jest', // Transform TypeScript files
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'], // File extensions to recognize
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'], // Match test files
    collectCoverage: true, // Enable coverage collection
    coverageDirectory: 'coverage', // Output directory for coverage reports
    coverageProvider: 'v8', // Use V8 for coverage (default)
  };
  