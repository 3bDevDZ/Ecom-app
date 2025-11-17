import React from 'react';
import { PaymentInfo as PaymentInfoType } from '../types/order.types';
import { OrderService } from '../services/order.service';
import './PaymentInfo.css';

interface PaymentInfoProps {
  paymentInfo: PaymentInfoType;
}

/**
 * PaymentInfo Component
 * Displays payment method and billing information
 */
export const PaymentInfo: React.FC<PaymentInfoProps> = ({ paymentInfo }) => {
  return (
    <div className="payment-info">
      <h2 className="payment-title">Payment Information</h2>

      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💳</span>
          <h3 className="info-subtitle">Payment Method</h3>
        </div>
        <div className="payment-method">{paymentInfo.method}</div>
      </div>

      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">🔒</span>
          <h3 className="info-subtitle">Transaction Details</h3>
        </div>
        <div className="transaction-details">
          <div className="transaction-item">
            <span className="transaction-label">Transaction ID:</span>
            <span className="transaction-value">{paymentInfo.transactionId}</span>
          </div>
          <div className="transaction-item">
            <span className="transaction-label">Payment Date:</span>
            <span className="transaction-value">
              {OrderService.formatDate(paymentInfo.paidAt)}
            </span>
          </div>
          <div className="payment-status">
            <span className="status-badge success">✓ Payment Confirmed</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">📍</span>
          <h3 className="info-subtitle">Billing Address</h3>
        </div>
        <div className="billing-address">
          <div>{paymentInfo.billingAddress.street}</div>
          <div>
            {paymentInfo.billingAddress.city}, {paymentInfo.billingAddress.state}{' '}
            {paymentInfo.billingAddress.postalCode}
          </div>
          <div>{paymentInfo.billingAddress.country}</div>
        </div>
      </div>
    </div>
  );
};
