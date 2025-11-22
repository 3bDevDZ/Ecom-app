import { Injectable } from '@nestjs/common';
import { CartDto } from '../../application/dtos/cart.dto';
import { OrderDto } from '../../application/dtos/order.dto';

/**
 * Cart Presenter (T173)
 *
 * Transforms domain DTOs into view models for Handlebars templates.
 * Responsibilities:
 * - Format data for view consumption
 * - Calculate display values
 * - Add view-specific helper properties
 * - Handle null/undefined values gracefully
 */
@Injectable()
export class CartPresenter {
    /**
     * Build view model for cart page
     */
    buildCartViewModel(cartDto: CartDto, user?: any): any {
        if (!cartDto) {
            return {
                cart: {
                    id: null,
                    items: [],
                    totalItems: 0,
                    subtotal: '0.00',
                    tax: '0.00',
                    shipping: '0.00',
                    total: '0.00',
                    isEmpty: true,
                },
                user: user || null,
            };
        }

        const subtotal = this.calculateSubtotal(cartDto);
        const tax = this.calculateTax(subtotal);
        const shipping = this.calculateShipping(subtotal);
        const total = subtotal + tax + shipping;

        return {
            cart: {
                id: cartDto.id,
                items: cartDto.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                })),
                totalItems: cartDto.items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal: this.formatCurrency(subtotal),
                tax: this.formatCurrency(tax),
                shipping: shipping > 0 ? this.formatCurrency(shipping) : null,
                total: this.formatCurrency(total),
                isEmpty: cartDto.items.length === 0,
            },
            user: user || null,
        };
    }

    /**
     * Build view model for checkout page
     */
    buildCheckoutViewModel(cartDto: CartDto, user?: any): any {
        if (!cartDto || cartDto.items.length === 0) {
            throw new Error('Cannot checkout with empty cart');
        }

        const subtotal = this.calculateSubtotal(cartDto);
        const tax = this.calculateTax(subtotal);
        const shipping = this.calculateShipping(subtotal);
        const total = subtotal + tax + shipping;

        return {
            cart: {
                id: cartDto.id,
                items: cartDto.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                })),
                totalItems: cartDto.items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal: this.formatCurrency(subtotal),
                tax: this.formatCurrency(tax),
                shipping: shipping > 0 ? this.formatCurrency(shipping) : null,
                total: this.formatCurrency(total),
            },
            user: user || null,
            // Pre-fill with user's default shipping address if available
            defaultAddress: user?.defaultShippingAddress || null,
        };
    }

    /**
     * Build view model for order confirmation page
     */
    buildOrderConfirmationViewModel(orderDto: OrderDto, user?: any): any {
        return {
            order: {
                ...orderDto,
                items: orderDto.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                    unitPrice: this.formatCurrency(item.unitPrice),
                })),
                total: this.formatCurrency(orderDto.totalAmount),
                statusDisplay: this.getOrderStatusDisplay(orderDto.status),
                estimatedDelivery: orderDto.deliveredAt
                    ? this.formatDate(new Date(orderDto.deliveredAt))
                    : 'TBD',
            },
            user: user || null,
        };
    }

    /**
     * Calculate cart subtotal
     */
    private calculateSubtotal(cartDto: CartDto): number {
        return cartDto.items.reduce((sum, item) => {
            return sum + item.lineTotal;
        }, 0);
    }

    /**
     * Calculate estimated tax
     * TODO: Integrate with real tax calculation service
     */
    private calculateTax(subtotal: number): number {
        // Simplified: 8% tax rate
        return subtotal * 0.08;
    }

    /**
     * Calculate shipping cost
     * TODO: Integrate with real shipping calculation service
     */
    private calculateShipping(subtotal: number): number {
        // Free shipping over $500
        if (subtotal >= 500) {
            return 0;
        }
        // Flat rate shipping
        return 25.0;
    }

    /**
     * Format currency value
     */
    private formatCurrency(value: number): string {
        return value.toFixed(2);
    }

    /**
     * Format date for display
     */
    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Get user-friendly order status display text
     */
    private getOrderStatusDisplay(status: string): string {
        const statusMap: Record<string, string> = {
            pending: 'Pending Confirmation',
            confirmed: 'Confirmed',
            external: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
        };

        return statusMap[status.toLowerCase()] || status;
    }

    /**
     * Build view model for order history page
     * User Story 3: View and Track Orders
     */
    toOrderHistoryViewModel(
        orders: OrderDto[],
        page: number,
        limit: number,
        total: number,
    ): any {
        return {
            orders: orders.map((order) => ({
                ...order,
                statusDisplay: this.getOrderStatusDisplay(order.status),
                totalFormatted: this.formatCurrency(order.totalAmount),
                orderDate: this.formatDate(new Date(order.createdAt)),
                itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
            breadcrumbs: [
                { label: 'Home', href: '/' },
                { label: 'Order History' },
            ],
        };
    }

    /**
     * Build view model for order detail page
     * User Story 3: View and Track Orders
     */
    toOrderDetailViewModel(order: OrderDto): any {
        return {
            order: {
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                    unitPrice: this.formatCurrency(item.unitPrice),
                })),
                statusDisplay: this.getOrderStatusDisplay(order.status),
                subtotalFormatted: this.formatCurrency(order.totalAmount),
                taxFormatted: this.formatCurrency(0), // TODO: Add tax calculation
                shippingFormatted: this.formatCurrency(0), // TODO: Add shipping calculation
                totalFormatted: this.formatCurrency(order.totalAmount),
                orderDate: this.formatDate(new Date(order.createdAt)),
                estimatedDelivery: 'To be determined', // TODO: Add delivery estimation
                itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
            },
            breadcrumbs: [
                { label: 'Home', href: '/' },
                { label: 'Order History', href: '/orders' },
                { label: `Order #${order.orderNumber}` },
            ],
        };
    }
}

