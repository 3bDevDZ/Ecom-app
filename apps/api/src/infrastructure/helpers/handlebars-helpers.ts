import { OrderStatus } from '../../domain/order/value-objects/order-status';

/**
 * Handlebars Helper Functions
 */
export const handlebarsHelpers = {
  /**
   * Format money for display
   */
  formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  /**
   * Get document icon emoji based on type
   */
  getDocumentIcon(type: string): string {
    const icons: Record<string, string> = {
      INVOICE: '📄',
      DELIVERY_NOTE: '📦',
      RETURN_LABEL: '🔙',
      RECEIPT: '🧾',
    };
    return icons[type] || '📋';
  },

  /**
   * Equality comparison helper
   */
  eq(a: any, b: any): boolean {
    return a === b;
  },

  /**
   * Or helper for conditional logic
   */
  or(...args: any[]): boolean {
    // Last argument is Handlebars options object, remove it
    const values = args.slice(0, -1);
    return values.some((val) => !!val);
  },

  /**
   * Unless helper
   */
  unless(conditional: any, options: any): any {
    if (!conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  },

  /**
   * Get current year for copyright
   */
  currentYear(): number {
    return new Date().getFullYear();
  },
};

/**
 * Prepare order data for template rendering
 */
export function prepareOrderData(order: any) {
  const statusSteps = [
    { key: 'PLACED', label: 'Placed', description: 'Order received' },
    { key: 'PROCESSED', label: 'Processed', description: 'Payment confirmed' },
    { key: 'SHIPPED', label: 'Shipped', description: 'On the way' },
    { key: 'DELIVERED', label: 'Delivered', description: 'Completed' },
  ];

  const currentStatus = order.status;
  const currentStepIndex = statusSteps.findIndex(
    (step) => step.key === currentStatus
  );

  const isCancelledOrRefunded =
    currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';

  const preparedSteps = statusSteps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
    isCompleted: index <= currentStepIndex,
    isCurrent: index === currentStepIndex,
    isLast: index === statusSteps.length - 1,
  }));

  return {
    order,
    statusSteps: preparedSteps,
    isCancelledOrRefunded,
    statusClass: currentStatus.toLowerCase(),
    status: currentStatus,
    canCancel: currentStatus === 'PLACED' || currentStatus === 'PROCESSED',
    canReturn: currentStatus === 'DELIVERED',
    title: `Order ${order.id}`,
  };
}
