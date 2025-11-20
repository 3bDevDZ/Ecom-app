const { composePlugins, withNx } = require('@nx/webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = composePlugins(withNx(), (config) => {
  // Configure webpack for NestJS + Handlebars + SCSS/Tailwind
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
  config.devtool = "source-map";

  // Configure proper mapping for source files
  config.output = config.output || {};
  config.output.devtoolModuleFilenameTemplate = (info) => {
    const rel = path.relative(process.cwd(), info.absoluteResourcePath);
    return `webpack:///./${rel}`;
  };

  // Configure module rules
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];

  // Handle .hbs files
  config.module.rules.push({
    test: /\.hbs$/,
    loader: 'handlebars-loader',
  });

  // Handle SCSS files with Tailwind CSS
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      // In development, use style-loader for hot reloading
      // In production, use MiniCssExtractPlugin for separate CSS files
      config.mode === 'production'
        ? MiniCssExtractPlugin.loader
        : 'style-loader',
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          postcssOptions: {
            plugins: [
              require('tailwindcss'),
              require('autoprefixer'),
            ],
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
        },
      },
    ],
  });

  // Configure plugins for CSS extraction in production
  if (config.mode === 'production') {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: 'css/styles.css',
      })
    );
  }

  // Configure resolve for SCSS files
  config.resolve = config.resolve || {};
  config.resolve.extensions = config.resolve.extensions || [];
  config.resolve.extensions.push('.scss', '.sass');

  // Configure entry points for frontend assets
  config.entry = config.entry || {};
  config.entry['frontend'] = './src/assets/frontend-entry.ts';

  return config;
});
