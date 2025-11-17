import React from 'react';
import { OrderStatus } from '../types/order.types';
import './SupportSection.css';

interface SupportSectionProps {
  orderId: string;
  orderStatus: OrderStatus;
}

/**
 * SupportSection Component
 * Provides support actions and help options
 */
export const SupportSection: React.FC<SupportSectionProps> = ({ orderId, orderStatus }) => {
  const handleContactSupport = () => {
    alert(`Contact Support for Order ${orderId}\n\nThis would open a support chat or contact form.`);
  };

  const handleReportIssue = () => {
    alert(`Report Issue for Order ${orderId}\n\nThis would open a form to report a problem with the order.`);
  };

  const handleRequestReturn = () => {
    alert(`Request Return for Order ${orderId}\n\nThis would start the return process.`);
  };

  const handleCancelOrder = () => {
    alert(`Cancel Order ${orderId}\n\nThis would initiate the cancellation process.`);
  };

  const canCancel = orderStatus === 'PLACED' || orderStatus === 'PROCESSED';
  const canReturn = orderStatus === 'DELIVERED';

  return (
    <div className="support-section">
      <h2 className="support-title">Need Help?</h2>
      <p className="support-description">
        Our support team is here to help you with any questions or issues regarding your order.
      </p>

      <div className="support-actions">
        <button onClick={handleContactSupport} className="support-btn primary">
          <span className="btn-icon">💬</span>
          <div className="btn-content">
            <div className="btn-title">Contact Support</div>
            <div className="btn-subtitle">Get help from our team</div>
          </div>
        </button>

        <button onClick={handleReportIssue} className="support-btn">
          <span className="btn-icon">⚠️</span>
          <div className="btn-content">
            <div className="btn-title">Report an Issue</div>
            <div className="btn-subtitle">Let us know about a problem</div>
          </div>
        </button>

        {canReturn && (
          <button onClick={handleRequestReturn} className="support-btn">
            <span className="btn-icon">🔄</span>
            <div className="btn-content">
              <div className="btn-title">Request Return</div>
              <div className="btn-subtitle">Start the return process</div>
            </div>
          </button>
        )}

        {canCancel && (
          <button onClick={handleCancelOrder} className="support-btn danger">
            <span className="btn-icon">❌</span>
            <div className="btn-content">
              <div className="btn-title">Cancel Order</div>
              <div className="btn-subtitle">Cancel this order</div>
            </div>
          </button>
        )}
      </div>

      <div className="support-info">
        <div className="info-item">
          <span className="info-icon">📧</span>
          <div className="info-text">
            <strong>Email:</strong> support@ecommerce.com
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">📞</span>
          <div className="info-text">
            <strong>Phone:</strong> 1-800-SUPPORT
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">⏰</span>
          <div className="info-text">
            <strong>Hours:</strong> Mon-Fri, 9AM-6PM EST
          </div>
        </div>
      </div>
    </div>
  );
};
