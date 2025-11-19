const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/test/**',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/main.ts',
    '!**/migrations/**',
    '!**/config/**',
    '!**/seeds/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

