import { NestExpressApplication } from '@nestjs/platform-express';
import { create } from 'express-handlebars';
import { join } from 'path';

interface HandlebarsConfigOptions {
  viewsPath: string;
}

/**
 * Handlebars Configuration for NestJS Application
 * Handles automatic partial registration for atomic design system
 */
export function createHandlebarsConfig({ viewsPath }: HandlebarsConfigOptions) {
  return create({
    layoutsDir: join(viewsPath, 'layouts'),
    defaultLayout: 'layout_main',
    extname: 'hbs',
    // Auto-detect partials from atomic design directories
    partialsDir: [
      join(viewsPath, 'partials', 'atoms'),
      join(viewsPath, 'partials', 'molecules'),
      join(viewsPath, 'partials', 'organisms'),
    ],
    // Runtime options to allow prototype property access
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    // Minimal helpers (no unused ones)
    helpers: {
      /**
       * String concatenation helper
       * Usage: {{concat "hello" " " "world"}}
       */
      concat: (...args: any[]) => {
        args.pop(); // Remove the Handlebars options object
        return args.join('');
      },

      /**
       * Class name builder helper
       * Usage: {{className "text-primary" size weight}}
       * Filters out undefined/falsy values and non-strings
       */
      className: (...args: any[]) => {
        args.pop(); // Remove the Handlebars options object
        const classes = args
          .map(arg => {
            // Convert to string if not already
            if (arg === null || arg === undefined) return '';
            if (typeof arg === 'string') return arg.trim();
            if (typeof arg === 'boolean') return ''; // Booleans don't become class names
            if (typeof arg === 'number') return String(arg);
            return String(arg).trim();
          })
          .filter(cls => cls && cls.length > 0)
          .join(' ');
        return classes;
      },

      /**
       * JSON stringify helper for debugging
       * Usage: {{json context}}
       */
      json: (context: any) => {
        return JSON.stringify(context, null, 2);
      },

      /**
       * Format date helper
       * Usage: {{formatDate date}}
       */
      formatDate: (date: Date | string) => {
        if (!date) return '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString();
      },

      /**
       * Conditional helper for complex conditions
       * Can be used as block helper: {{#ifCond var1 "==" var2}}...{{else}}...{{/ifCond}}
       * Or as regular helper: {{ifCond var1 "==" var2}} (returns boolean)
       */
      ifCond: function (v1: any, operator: string, v2: any, options?: any) {
        // Check if this is a block helper call (has options with fn/inverse)
        const isBlockHelper = options && typeof options.fn === 'function' && typeof options.inverse === 'function';

        // Evaluate the condition
        let result: boolean;
        switch (operator) {
          case '==':
            result = v1 == v2;
            break;
          case '===':
            result = v1 === v2;
            break;
          case '!=':
            result = v1 != v2;
            break;
          case '!==':
            result = v1 !== v2;
            break;
          case '<':
            result = v1 < v2;
            break;
          case '<=':
            result = v1 <= v2;
            break;
          case '>':
            result = v1 > v2;
            break;
          case '>=':
            result = v1 >= v2;
            break;
          case '&&':
            result = v1 && v2;
            break;
          case '||':
            result = v1 || v2;
            break;
          default:
            result = false;
        }

        // If block helper, return the appropriate block
        if (isBlockHelper) {
          return result ? options.fn(this) : options.inverse(this);
        }

        // If regular helper, return boolean
        return result;
      },

      /**
       * Conditional value helper - returns a value if condition is true
       * Usage: {{condIf condition "value-if-true" "value-if-false"}}
       * Always returns a string to avoid issues with className helper
       */
      condIf: (condition: any, trueValue: any, falseValue: any = '') => {
        const result = condition ? trueValue : falseValue;
        // Ensure we always return a string
        if (result === null || result === undefined) return '';
        if (typeof result === 'boolean') return '';
        return String(result);
      },

      /**
       * Format currency
       * Usage: {{formatCurrency amount}}
       */
      formatCurrency: (amount: number, currency: string = 'USD'): string => {
        if (typeof amount !== 'number') return '';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      },

      /**
       * Conditional equality check
       * Usage: {{#ifEquals value1 value2}}...{{/ifEquals}}
       */
      ifEquals: function (arg1: any, arg2: any, options: any) {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
      },

      /**
       * Conditional check for value in array
       * Usage: {{#ifInArray value array}}...{{/ifInArray}}
       */
      ifInArray: function (value: any, array: any[], options: any) {
        if (!Array.isArray(array)) return options.inverse(this);
        return array.includes(value) ? options.fn(this) : options.inverse(this);
      },

      /**
       * Truncate string
       * Usage: {{truncate text 100}}
       */
      truncate: (text: string, length: number): string => {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
      },

      /**
       * Calculate percentage
       * Usage: {{percentage value total}}
       */
      percentage: (value: number, total: number): string => {
        if (!total || total === 0) return '0%';
        return ((value / total) * 100).toFixed(1) + '%';
      },

      /**
       * Format number with commas
       * Usage: {{formatNumber 1000000}}
       */
      formatNumber: (num: number): string => {
        if (typeof num !== 'number') return '';
        return num.toLocaleString('en-US');
      },

      /**
       * Join array with separator
       * Usage: {{join array ", "}}
       */
      join: (array: any[], separator: string = ', '): string => {
        if (!Array.isArray(array)) return '';
        return array.join(separator);
      },

      /**
       * Get first N items from array
       * Usage: {{#each (limit items 5)}}...{{/each}}
       */
      limit: (array: any[], limit: number): any[] => {
        if (!Array.isArray(array)) return [];
        return array.slice(0, limit);
      },

      /**
       * Capitalize first letter
       * Usage: {{capitalize text}}
       */
      capitalize: (text: string): string => {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
      },

      /**
       * Convert to uppercase
       * Usage: {{uppercase text}}
       */
      uppercase: (text: string): string => {
        return text ? text.toUpperCase() : '';
      },

      /**
       * Convert to lowercase
       * Usage: {{lowercase text}}
       */
      lowercase: (text: string): string => {
        return text ? text.toLowerCase() : '';
      },

      /**
       * Math operations
       * Usage: {{math value "+" 1}}
       */
      math: (lvalue: number, operator: string, rvalue: number): number => {
        lvalue = parseFloat(String(lvalue));
        rvalue = parseFloat(String(rvalue));

        switch (operator) {
          case '+':
            return lvalue + rvalue;
          case '-':
            return lvalue - rvalue;
          case '*':
            return lvalue * rvalue;
          case '/':
            return lvalue / rvalue;
          case '%':
            return lvalue % rvalue;
          default:
            return lvalue;
        }
      },

      /**
       * Check if user has role
       * Usage: {{#hasRole user "admin"}}...{{/hasRole}}
       */
      hasRole: function (user: any, role: string, options: any) {
        if (!user || !user.roles) return options.inverse(this);
        return user.roles.includes(role) ? options.fn(this) : options.inverse(this);
      },

      /**
       * Check if array has a primary image
       * Usage: {{#hasPrimaryImage images}}...{{/hasPrimaryImage}}
       */
      hasPrimaryImage: function (images: any[], options: any) {
        if (!Array.isArray(images)) return options.inverse(this);
        return images.some((img: any) => img.isPrimary) ? options.fn(this) : options.inverse(this);
      },

      /**
       * Call a method on an object
       * Usage: {{callMethod product "getTotalAvailableQuantity"}}
       */
      callMethod: function (obj: any, methodName: string, ...args: any[]) {
        if (!obj || typeof obj[methodName] !== 'function') return '';
        return obj[methodName](...args);
      },

      /**
       * Calculate final price with base price and delta
       * Usage: {{calculatePrice basePrice priceDelta}}
       */
      calculatePrice: (basePrice: number, priceDelta: number | null): number => {
        if (priceDelta === null || priceDelta === undefined) return basePrice;
        return basePrice + priceDelta;
      },

      /**
       * Check if value is greater than another
       * Usage: {{#if (greaterThan value 0)}}...{{/if}}
       */
      greaterThan: (value: number, compare: number): boolean => {
        return value > compare;
      },
    }
  });
}

/**
 * Setup Handlebars view engine for NestJS Express application
 */
export function setupHandlebarsEngine(app: NestExpressApplication, viewsPath: string) {
  const hbsInstance = createHandlebarsConfig({ viewsPath });

  // Register Handlebars with Express using the new structure
  app.engine('hbs', hbsInstance.engine);
  app.setViewEngine('hbs');
  app.setBaseViewsDir(join(viewsPath, 'pages'));

  console.log('🎨 Handlebars View Engine: Configured');
  console.log('📁 Views Path:', join(viewsPath, 'pages'));
  console.log('🧩 Atomic Design Partials: Auto-detected');
  console.log('📐 Layouts:', join(viewsPath, 'layouts'));
  console.log('🧱 Partials:', join(viewsPath, 'partials'));
}
