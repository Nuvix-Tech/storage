export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const testMatch = ['**/__tests__/**/*.test.ts'];
export const collectCoverage = true;
export const coverageDirectory = 'coverage';
export const collectCoverageFrom = [
  'src/**/*.ts',
  '!src/**/*.d.ts',
]; 