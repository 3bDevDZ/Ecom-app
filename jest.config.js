module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.module.ts",
    "!src/**/*.dto.ts",
    "!src/main.ts",
    "!src/migrations/**",
    "!src/scripts/**",
  ],
  coverageDirectory: "./coverage",
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
  },
};
