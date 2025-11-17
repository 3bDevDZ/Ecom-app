import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/order/repositories/order.repository.interface';
import { Order } from '../../domain/order/entities/order.entity';
import { OrderItem } from '../../domain/order/entities/order-item.entity';
import { Customer } from '../../domain/order/entities/customer.entity';
import { Document, DocumentType } from '../../domain/order/entities/document.entity';
import { OrderStatusVO, OrderStatus } from '../../domain/order/value-objects/order-status';
import { Money } from '../../domain/order/value-objects/money';
import { Address } from '../../domain/order/value-objects/address';

/**
 * In-Memory Order Repository (Adapter)
 * Implements the IOrderRepository interface for testing/demo purposes
 */
@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();

  constructor() {
    this.seedMockData();
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.getCustomer().getId() === customerId,
    );
  }

  async save(order: Order): Promise<Order> {
    this.orders.set(order.getId(), order);
    return order;
  }

  async update(order: Order): Promise<Order> {
    this.orders.set(order.getId(), order);
    return order;
  }

  async delete(id: string): Promise<void> {
    this.orders.delete(id);
  }

  async findAll(page: number, limit: number): Promise<{ orders: Order[]; total: number }> {
    const allOrders = Array.from(this.orders.values());
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      orders: allOrders.slice(start, end),
      total: allOrders.length,
    };
  }

  /**
   * Seed mock data for testing
   */
  private seedMockData(): void {
    const customer = Customer.create({
      id: 'cust-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
    });

    const shippingAddress = Address.create({
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    });

    const billingAddress = Address.create({
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    });

    const items = [
      OrderItem.create({
        id: 'item-001',
        productId: 'prod-001',
        productName: 'Premium Wireless Headphones',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        quantity: 1,
        unitPrice: Money.create(299.99),
        variant: { color: 'Black', size: 'Standard' },
      }),
      OrderItem.create({
        id: 'item-002',
        productId: 'prod-002',
        productName: 'USB-C Charging Cable',
        productImage: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        quantity: 2,
        unitPrice: Money.create(19.99),
        variant: { color: 'White', length: '2m' },
      }),
    ];

    const documents = [
      Document.create({
        id: 'doc-001',
        type: DocumentType.INVOICE,
        name: 'Invoice #ORD-2024-001',
        url: '/documents/invoice-ord-2024-001.pdf',
        createdAt: new Date('2024-11-15T10:30:00Z'),
      }),
      Document.create({
        id: 'doc-002',
        type: DocumentType.DELIVERY_NOTE,
        name: 'Delivery Note',
        url: '/documents/delivery-note-ord-2024-001.pdf',
        createdAt: new Date('2024-11-15T14:20:00Z'),
      }),
      Document.create({
        id: 'doc-003',
        type: DocumentType.RETURN_LABEL,
        name: 'Return Label',
        url: '/documents/return-label-ord-2024-001.pdf',
        createdAt: new Date('2024-11-15T10:30:00Z'),
      }),
    ];

    const subtotal = Money.create(339.97);
    const taxAmount = Money.create(27.20);
    const shippingCost = Money.create(15.00);
    const totalAmount = Money.create(382.17);

    const order = Order.create({
      id: 'ORD-2024-001',
      customer,
      items,
      status: OrderStatusVO.create(OrderStatus.SHIPPED),
      shippingAddress,
      shippingInfo: {
        method: 'Express Shipping',
        trackingNumber: 'TRK123456789',
        estimatedDelivery: new Date('2024-11-20T18:00:00Z'),
      },
      paymentInfo: {
        method: 'Credit Card (Visa ending in 4242)',
        transactionId: 'txn_1234567890abcdef',
        paidAt: new Date('2024-11-15T10:25:00Z'),
        billingAddress,
      },
      documents,
      subtotal,
      taxAmount,
      shippingCost,
      totalAmount,
      createdAt: new Date('2024-11-15T10:20:00Z'),
      updatedAt: new Date('2024-11-15T14:20:00Z'),
    });

    this.orders.set(order.getId(), order);
  }
}
