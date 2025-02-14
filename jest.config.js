/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          useESM: true,
          tsconfig: "tsconfig.test.json"
        },
      ],
    },
    moduleDirectories: ['node_modules', 'tests/__mocks__'],
    setupFiles: ['<rootDir>/tests/setup.js'],
};