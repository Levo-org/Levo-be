import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/loadEnv.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: undefined,
  globalTeardown: undefined,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  verbose: true,
};

export default config;
