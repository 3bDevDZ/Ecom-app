const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Configure webpack for NestJS + Handlebars
  config.externals = config.externals || [];
  
  // Mark these as external to avoid bundling
  if (Array.isArray(config.externals)) {
    config.externals.push({
      'handlebars': 'commonjs handlebars',
      'express-handlebars': 'commonjs express-handlebars',
      '@nestjs/microservices': 'commonjs @nestjs/microservices',
      '@nestjs/websockets': 'commonjs @nestjs/websockets',
      'amqplib': 'commonjs amqplib',
      'amqp-connection-manager': 'commonjs amqp-connection-manager',
      'cache-manager': 'commonjs cache-manager',
      'class-transformer': 'commonjs class-transformer',
      'class-validator': 'commonjs class-transformer',
      'class-validator': 'commonjs class-validator',
    });
  }

  // Enable source maps for better debugging
  config.devtool = 'source-map';

  // Handle .hbs files
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /\.hbs$/,
    loader: 'handlebars-loader',
  });

  return config;
});
