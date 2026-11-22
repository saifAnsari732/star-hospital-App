const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName === 'react-native-web/dist/exports/Share'
  ) {
    return {
      filePath: path.resolve(__dirname, 'src/utils/share.ts'),
      type: 'sourceFile',
    };
  }

  try {
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  } catch (err) {
    try {
      const originDir = context.originModulePath
        ? path.dirname(context.originModulePath)
        : __dirname;
      const resolvedPath = require.resolve(moduleName, {
        paths: [originDir, __dirname],
      });
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    } catch {
      throw err;
    }
  }
};

module.exports = config;
