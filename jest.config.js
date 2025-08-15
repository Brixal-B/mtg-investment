module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "<rootDir>/src/test/setup.ts"
  ],
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)",
    "<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)",
    "!<rootDir>/src/**/e2e/**/*"
  ],
  collectCoverageFrom: [
    "src/**/*.(ts|tsx)",
    "!src/**/*.d.ts",
    "!src/test/**/*",
    "!src/**/__tests__/**/*"
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "lcov", 
    "html",
    "json-summary"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest", {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
          decorators: false,
          dynamicImport: false
        }
      }
    }],
    "^.+\\.(js|jsx)$": ["@swc/jest"]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$"
  ]
};