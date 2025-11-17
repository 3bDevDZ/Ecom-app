import React from 'react';
import { OrderItem } from '../types/order.types';
import { OrderService } from '../services/order.service';
import './ProductsSection.css';

interface ProductsSectionProps {
  items: OrderItem[];
}

/**
 * ProductsSection Component
 * Displays all products in the order with details
 */
export const ProductsSection: React.FC<ProductsSectionProps> = ({ items }) => {
  return (
    <div className="products-section">
      <h2 className="products-title">Order Items</h2>
      <div className="products-list">
        {items.map((item) => (
          <div key={item.id} className="product-item">
            <div className="product-image-container">
              <img
                src={item.productImage}
                alt={item.productName}
                className="product-image"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/100x100?text=No+Image';
                }}
              />
            </div>
            <div className="product-details">
              <div className="product-name">{item.productName}</div>
              {item.variant && Object.keys(item.variant).length > 0 && (
                <div className="product-variants">
                  {Object.entries(item.variant).map(([key, value]) => (
                    <span key={key} className="variant-badge">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
              <div className="product-meta">
                <span className="product-price">
                  {OrderService.formatMoney(item.unitPrice.amount, item.unitPrice.currency)}
                </span>
                <span className="product-quantity">Qty: {item.quantity}</span>
              </div>
            </div>
            <div className="product-subtotal">
              <div className="subtotal-label">Subtotal</div>
              <div className="subtotal-value">
                {OrderService.formatMoney(item.subtotal.amount, item.subtotal.currency)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
