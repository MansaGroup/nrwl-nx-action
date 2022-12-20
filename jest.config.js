module.exports = {
  setupFilesAfterEnv: ["jest-extended/all"],
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/o,dex.ts'],
  reporters: ['default', 'jest-sonar'],
  coverageDirectory: './coverage',
  verbose: true,
};
