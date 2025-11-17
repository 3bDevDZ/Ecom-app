import React, { useEffect, useState } from 'react';
import { OrderStatusTracker } from '../components/OrderStatusTracker';
import { OrderSummary } from '../components/OrderSummary';
import { DocumentsSection } from '../components/DocumentsSection';
import { ProductsSection } from '../components/ProductsSection';
import { ShippingInfo } from '../components/ShippingInfo';
import { PaymentInfo } from '../components/PaymentInfo';
import { SupportSection } from '../components/SupportSection';
import { OrderService } from '../services/order.service';
import { Order } from '../types/order.types';
import './OrderDetailsPage.css';

/**
 * OrderDetailsPage Component
 * Main page displaying complete order details
 */
export const OrderDetailsPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Using the mock order ID from the repository
      const orderData = await OrderService.getOrderById('ORD-2024-001');
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Order</h2>
          <p>{error}</p>
          <button onClick={loadOrderDetails} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="error-container">
          <div className="error-icon">📦</div>
          <h2>Order Not Found</h2>
          <p>The requested order could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Order Details</h1>
          <div className="order-id">Order #{order.id}</div>
        </div>
        <button onClick={() => window.print()} className="print-btn">
          🖨️ Print Order
        </button>
      </div>

      <div className="page-content">
        <div className="content-main">
          <OrderStatusTracker currentStatus={order.status} />
          <ProductsSection items={order.items} />
          <DocumentsSection documents={order.documents} />
        </div>

        <div className="content-sidebar">
          <OrderSummary order={order} />
          <ShippingInfo shippingAddress={order.shippingAddress} shippingInfo={order.shippingInfo} />
          <PaymentInfo paymentInfo={order.paymentInfo} />
          <SupportSection orderId={order.id} orderStatus={order.status} />
        </div>
      </div>
    </div>
  );
};
