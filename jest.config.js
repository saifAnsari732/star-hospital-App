const fs = require('fs');
const path = require('path');

const setupFile = path.resolve(__dirname, 'tests/setupTests.ts');

module.exports = {
  preset: 'jest-expo',
  ...(fs.existsSync(setupFile) ? { setupFilesAfterEnv: [setupFile] } : {}),
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
