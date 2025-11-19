/**
 * Handlebars Helper Functions
 *
 * Custom helpers for use in Handlebars templates
 */

export const handlebarHelpers = {
  /**
   * Format date to readable string
   * Usage: {{formatDate date}}
   */
  formatDate: (date: Date | string): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
   * JSON stringify for debugging
   * Usage: {{json object}}
   */
  json: (context: any): string => {
    return JSON.stringify(context, null, 2);
  },
};

/**
 * Register helpers with Handlebars instance
 */
export function registerHelpers(hbs: any): void {
  Object.entries(handlebarHelpers).forEach(([name, helper]) => {
    hbs.registerHelper(name, helper);
  });
}
