import React from 'react';

// In-memory AsyncStorage mock
const asyncStorageData = new Map<string, string>();

export const mockAsyncStorage = {
  getItem: jest.fn(async (key: string) => asyncStorageData.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    asyncStorageData.set(key, String(value));
  }),
  removeItem: jest.fn(async (key: string) => {
    asyncStorageData.delete(key);
  }),
  clear: jest.fn(async () => {
    asyncStorageData.clear();
  }),
  getAllKeys: jest.fn(async () => Array.from(asyncStorageData.keys())),
  multiGet: jest.fn(async (keys: string[]) => keys.map((k) => [k, asyncStorageData.get(k) ?? null])),
  multiSet: jest.fn(async (pairs: [string, string][]) => {
    pairs.forEach(([k, v]) => asyncStorageData.set(k, String(v)));
  }),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((k) => asyncStorageData.delete(k));
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 44, right: 0, bottom: 34, left: 0 };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children(insets),
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: jest.fn(() => insets),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 375, height: 812 })),
  };
});

// React Native Screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  screensEnabled: jest.fn(() => true),
}));

// Vector icons and lucide-react-native
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = (props: any) =>
    React.createElement(Text, { testID: props.testID || 'expo-vector-icon' }, props.name || 'icon');
  return {
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    Ionicons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, prop: string) => {
        return (props: any) =>
          React.createElement(
            Text,
            { testID: props.testID || `lucide-icon-${prop}`, ...props },
            prop
          );
      },
    }
  );
});

// Expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(true),
  isLoaded: jest.fn().mockReturnValue(true),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'Star Hospital',
      slug: 'star-hospital-app',
      version: '1.0.0',
    },
  },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
  createURL: jest.fn((path: string) => `starhospital://${path}`),
}));

// React Native Share
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));

// Global afterEach cleanup
afterEach(() => {
  asyncStorageData.clear();
  jest.clearAllMocks();
});
