const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Enable source maps for better debugging
  config.devtool = 'source-map';
  
  // Configure output for source maps
  if (!config.output) config.output = {};
  config.output.devtoolModuleFilenameTemplate = '[absolute-resource-path]';
  
  // Ensure source maps work with the existing TypeScript configuration
  if (config.resolve) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false, // Node.js polyfill for path
    };
  }
  
  return config;
});
