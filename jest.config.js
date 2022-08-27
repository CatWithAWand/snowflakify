/**
 * @type {import('ts-jest/dist/types').InitialOptionsTsJest}
 * To configure ESM support, see: https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
 *
 * */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
