import React from 'react';
import { Address, ShippingInfo as ShippingInfoType } from '../types/order.types';
import { OrderService } from '../services/order.service';
import './ShippingInfo.css';

interface ShippingInfoProps {
  shippingAddress: Address;
  shippingInfo: ShippingInfoType;
}

/**
 * ShippingInfo Component
 * Displays shipping address and delivery information
 */
export const ShippingInfo: React.FC<ShippingInfoProps> = ({ shippingAddress, shippingInfo }) => {
  const handleTrackPackage = () => {
    if (shippingInfo.trackingNumber) {
      alert(`Tracking Number: ${shippingInfo.trackingNumber}\n\nThis would redirect to the carrier's tracking page.`);
    }
  };

  return (
    <div className="shipping-info">
      <h2 className="shipping-title">Shipping Information</h2>

      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">📍</span>
          <h3 className="info-subtitle">Delivery Address</h3>
        </div>
        <div className="address-block">
          <div>{shippingAddress.street}</div>
          <div>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </div>
          <div>{shippingAddress.country}</div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">🚚</span>
          <h3 className="info-subtitle">Shipping Method</h3>
        </div>
        <div className="shipping-method">{shippingInfo.method}</div>
      </div>

      {shippingInfo.trackingNumber && (
        <div className="info-section">
          <div className="info-header">
            <span className="info-icon">📦</span>
            <h3 className="info-subtitle">Tracking Information</h3>
          </div>
          <div className="tracking-info">
            <div className="tracking-number">
              <span className="tracking-label">Tracking Number:</span>
              <span className="tracking-value">{shippingInfo.trackingNumber}</span>
            </div>
            <button onClick={handleTrackPackage} className="btn-track">
              Track Package
            </button>
          </div>
        </div>
      )}

      {(shippingInfo.estimatedDelivery || shippingInfo.actualDelivery) && (
        <div className="info-section">
          <div className="info-header">
            <span className="info-icon">📅</span>
            <h3 className="info-subtitle">Delivery Date</h3>
          </div>
          <div className="delivery-dates">
            {shippingInfo.estimatedDelivery && (
              <div className="delivery-item">
                <span className="delivery-label">Estimated:</span>
                <span className="delivery-value">
                  {OrderService.formatDate(shippingInfo.estimatedDelivery)}
                </span>
              </div>
            )}
            {shippingInfo.actualDelivery && (
              <div className="delivery-item">
                <span className="delivery-label">Delivered:</span>
                <span className="delivery-value delivered">
                  {OrderService.formatDate(shippingInfo.actualDelivery)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
