import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddressProps } from '../../domain/value-objects/address';

/**
 * Order Email Service (T163)
 *
 * Handles sending transactional emails for order management.
 * - Order confirmation
 * - Order cancellation
 * - Order status updates
 *
 * Note: This is a simplified implementation. In production, you would:
 * - Integrate with an email service (SendGrid, AWS SES, Mailgun)
 * - Use email templates (Handlebars, Pug, etc.)
 * - Add retry logic and error handling
 * - Queue emails for background processing
 */
@Injectable()
export class OrderEmailService {
  private readonly logger = new Logger(OrderEmailService.name);
  private readonly fromEmail: string;
  private readonly supportEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@b2b-ecommerce.com');
    this.supportEmail = this.configService.get('EMAIL_SUPPORT', 'support@b2b-ecommerce.com');
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    userId: string,
    orderNumber: string,
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
    total: number,
    shippingAddress: AddressProps,
  ): Promise<void> {
    this.logger.log(`Sending order confirmation email for order ${orderNumber} to user ${userId}`);

    try {
      // TODO: Replace with actual email service integration
      const emailContent = this.buildOrderConfirmationEmail(
        orderNumber,
        items,
        total,
        shippingAddress,
      );

      // Simulate email sending
      // In production: await this.emailClient.send(emailContent);
      this.logger.debug(`Email content:\n${emailContent}`);

      this.logger.log(`Order confirmation email sent successfully for ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send order cancellation email
   */
  async sendOrderCancellation(
    userId: string,
    orderNumber: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(`Sending order cancellation email for order ${orderNumber} to user ${userId}`);

    try {
      const emailContent = this.buildOrderCancellationEmail(orderNumber, reason);

      // Simulate email sending
      // In production: await this.emailClient.send(emailContent);
      this.logger.debug(`Email content:\n${emailContent}`);

      this.logger.log(`Order cancellation email sent successfully for ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order cancellation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(
    userId: string,
    orderNumber: string,
    newStatus: string,
    trackingInfo?: {
      carrier: string;
      trackingNumber: string;
    },
  ): Promise<void> {
    this.logger.log(
      `Sending order status update email for order ${orderNumber}: ${newStatus} to user ${userId}`,
    );

    try {
      const emailContent = this.buildOrderStatusUpdateEmail(orderNumber, newStatus, trackingInfo);

      // Simulate email sending
      this.logger.debug(`Email content:\n${emailContent}`);

      this.logger.log(`Order status update email sent successfully for ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order status update email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build order confirmation email content
   */
  private buildOrderConfirmationEmail(
    orderNumber: string,
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>,
    total: number,
    shippingAddress: AddressProps,
  ): string {
    const itemsList = items
      .map(
        (item) =>
          `- ${item.productName} (Qty: ${item.quantity}) - $${item.unitPrice} = $${item.subtotal}`,
      )
      .join('\n');

    return `
Subject: Order Confirmation - ${orderNumber}
From: ${this.fromEmail}
To: User ${orderNumber.split('-')[0]} (via user ID lookup)

Dear Customer,

Thank you for your order! Your order has been confirmed and is being processed.

ORDER DETAILS
-------------
Order Number: ${orderNumber}
Order Date: ${new Date().toLocaleDateString()}

ITEMS ORDERED
-------------
${itemsList}

TOTAL: $${total.toFixed(2)}

SHIPPING ADDRESS
----------------
${shippingAddress.contactName}
${shippingAddress.street}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
${shippingAddress.country}
Phone: ${shippingAddress.contactPhone}

You will receive another email when your order ships.

If you have any questions, please contact us at ${this.supportEmail}

Thank you for your business!

Best regards,
B2B E-Commerce Team
    `.trim();
  }

  /**
   * Build order cancellation email content
   */
  private buildOrderCancellationEmail(orderNumber: string, reason: string): string {
    return `
Subject: Order Cancelled - ${orderNumber}
From: ${this.fromEmail}

Dear Customer,

Your order ${orderNumber} has been cancelled.

Reason: ${reason}

If you did not request this cancellation or have any questions,
please contact us at ${this.supportEmail}

Best regards,
B2B E-Commerce Team
    `.trim();
  }

  /**
   * Build order status update email content
   */
  private buildOrderStatusUpdateEmail(
    orderNumber: string,
    newStatus: string,
    trackingInfo?: {
      carrier: string;
      trackingNumber: string;
    },
  ): string {
    let trackingSection = '';
    if (trackingInfo) {
      trackingSection = `
TRACKING INFORMATION
--------------------
Carrier: ${trackingInfo.carrier}
Tracking Number: ${trackingInfo.trackingNumber}
`;
    }

    return `
Subject: Order Status Update - ${orderNumber}
From: ${this.fromEmail}

Dear Customer,

Your order ${orderNumber} status has been updated to: ${newStatus}

${trackingSection}

You can track your order status at: https://b2b-ecommerce.com/orders/${orderNumber}

If you have any questions, please contact us at ${this.supportEmail}

Best regards,
B2B E-Commerce Team
    `.trim();
  }
}

