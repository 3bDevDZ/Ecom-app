import React from 'react';
import { Order } from '../types/order.types';
import { OrderService } from '../services/order.service';
import './OrderSummary.css';

interface OrderSummaryProps {
  order: Order;
}

/**
 * OrderSummary Component
 * Displays order summary information
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  return (
    <div className="order-summary">
      <h2 className="summary-title">Order Summary</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">Order ID</div>
          <div className="summary-value">{order.id}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Order Date</div>
          <div className="summary-value">{OrderService.formatDate(order.createdAt)}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Payment Method</div>
          <div className="summary-value">{order.paymentInfo.method}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Transaction ID</div>
          <div className="summary-value transaction-id">{order.paymentInfo.transactionId}</div>
        </div>
      </div>

      <div className="customer-info">
        <h3 className="customer-title">Customer Information</h3>
        <div className="customer-details">
          <div className="customer-item">
            <span className="customer-icon">👤</span>
            <div>
              <div className="customer-name">{order.customer.name}</div>
              <div className="customer-meta">{order.customer.email}</div>
            </div>
          </div>
          {order.customer.phone && (
            <div className="customer-item">
              <span className="customer-icon">📞</span>
              <div>
                <div className="customer-meta">{order.customer.phone}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="price-breakdown">
        <div className="price-row">
          <span>Subtotal</span>
          <span>{OrderService.formatMoney(order.subtotal.amount, order.subtotal.currency)}</span>
        </div>
        <div className="price-row">
          <span>Tax</span>
          <span>{OrderService.formatMoney(order.taxAmount.amount, order.taxAmount.currency)}</span>
        </div>
        <div className="price-row">
          <span>Shipping</span>
          <span>{OrderService.formatMoney(order.shippingCost.amount, order.shippingCost.currency)}</span>
        </div>
        <div className="price-row total">
          <span>Total</span>
          <span className="total-amount">
            {OrderService.formatMoney(order.totalAmount.amount, order.totalAmount.currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
