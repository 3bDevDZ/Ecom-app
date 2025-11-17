import React from 'react';
import { OrderStatus } from '../types/order.types';
import './OrderStatusTracker.css';

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus;
}

interface StatusStep {
  key: OrderStatus;
  label: string;
  description: string;
}

const STATUS_STEPS: StatusStep[] = [
  { key: 'PLACED', label: 'Placed', description: 'Order received' },
  { key: 'PROCESSED', label: 'Processed', description: 'Payment confirmed' },
  { key: 'SHIPPED', label: 'Shipped', description: 'On the way' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Completed' },
];

/**
 * OrderStatusTracker Component
 * Visual progress tracker showing the current order status
 */
export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ currentStatus }) => {
  const getCurrentStepIndex = () => {
    if (currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED') {
      return -1;
    }
    return STATUS_STEPS.findIndex((step) => step.key === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelledOrRefunded = currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';

  return (
    <div className="order-status-tracker">
      <h2 className="tracker-title">Order Status</h2>

      {isCancelledOrRefunded ? (
        <div className={`status-alert ${currentStatus.toLowerCase()}`}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Order {currentStatus.toLowerCase()}</strong>
            <p>
              {currentStatus === 'CANCELLED'
                ? 'This order has been cancelled'
                : 'This order has been refunded'}
            </p>
          </div>
        </div>
      ) : (
        <div className="status-steps">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.key} className="step-container">
                <div className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-circle">
                    {isCompleted ? (
                      <span className="checkmark">✓</span>
                    ) : (
                      <span className="step-number">{index + 1}</span>
                    )}
                  </div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
                {index < STATUS_STEPS.length - 1 && (
                  <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
