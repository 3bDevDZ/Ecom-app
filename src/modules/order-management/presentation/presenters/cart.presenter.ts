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
            title: 'Shopping Cart',
            cart: {
                id: cartDto.id,
                items: cartDto.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                    unitPriceFormatted: this.formatCurrency(item.unitPrice),
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
            title: 'Review Your Order',
            cart: {
                id: cartDto.id,
                items: cartDto.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                    unitPriceFormatted: this.formatCurrency(item.unitPrice),
                    lineTotalFormatted: this.formatCurrency(item.lineTotal),
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
            received: 'Received',
            in_confirmation: 'In Confirmation',
            confirmed: 'Confirmed',
            in_shipping: 'In Shipping',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            // Legacy compatibility
            pending: 'Received',
            processing: 'In Confirmation',
        };

        return statusMap[status.toLowerCase()] || status;
    }

    /**
     * Get order status badge color class
     */
    getOrderStatusBadgeClass(status: string): string {
        const statusClassMap: Record<string, string> = {
            received: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
            in_confirmation: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
            confirmed: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
            in_shipping: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
            shipped: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
            delivered: 'bg-success/20 text-success',
            cancelled: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
            // Legacy compatibility
            pending: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
            processing: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
        };

        return statusClassMap[status.toLowerCase()] || 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300';
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
        console.log('[CartPresenter] toOrderHistoryViewModel - orders received:', orders.length);
        console.log('[CartPresenter] toOrderHistoryViewModel - total:', total);

        const viewOrders = orders.map((order) => {
            try {
                return {
                    ...order,
                    statusDisplay: this.getOrderStatusDisplay(order.status),
                    statusBadgeClass: this.getOrderStatusBadgeClass(order.status),
                    totalFormatted: this.formatCurrency(order.totalAmount),
                    orderDate: this.formatDate(new Date(order.createdAt)),
                    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
                    hasReceipt: !!order.receiptUrl,
                };
            } catch (error: any) {
                console.error(`[CartPresenter] Error mapping order ${order.id}:`, error.message);
                return null;
            }
        }).filter(order => order !== null);

        console.log('[CartPresenter] toOrderHistoryViewModel - orders after mapping:', viewOrders.length);

        return {
            orders: viewOrders,
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
        // Calculate subtotal from items
        const subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);

        // Calculate tax (8% of subtotal)
        const tax = subtotal * 0.08;

        // Calculate shipping (free over $500, otherwise $25)
        const shipping = subtotal >= 500 ? 0 : 25.0;

        // Total should match order.totalAmount
        const calculatedTotal = subtotal + tax + shipping;

        // Helper to check if status is in a set of statuses
        const isStatusIn = (status: string, statuses: string[]): boolean => {
            return statuses.includes(status.toLowerCase());
        };

        const status = order.status.toLowerCase();
        const isProcessingActive = isStatusIn(status, ['in_confirmation', 'confirmed', 'in_shipping', 'shipped', 'delivered']);
        const isShippedActive = isStatusIn(status, ['shipped', 'delivered']);
        const isDeliveredActive = isStatusIn(status, ['delivered']);

        return {
            order: {
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    subtotal: this.formatCurrency(item.lineTotal),
                    unitPrice: this.formatCurrency(item.unitPrice),
                })),
                statusDisplay: this.getOrderStatusDisplay(order.status),
                subtotalFormatted: this.formatCurrency(subtotal),
                taxFormatted: this.formatCurrency(tax),
                shippingFormatted: this.formatCurrency(shipping),
                totalFormatted: this.formatCurrency(order.totalAmount),
                orderDate: this.formatDate(new Date(order.createdAt)),
                estimatedDelivery: order.deliveredAt
                    ? this.formatDate(new Date(order.deliveredAt))
                    : 'To be determined',
                itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
                hasReceipt: !!order.receiptUrl,
                // Progress tracker flags
                isProcessingActive,
                isShippedActive,
                isDeliveredActive,
                // Ensure addresses are available
                shippingAddress: order.shippingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: '',
                    contactName: '',
                    contactPhone: '',
                },
                billingAddress: order.billingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: '',
                    contactName: '',
                    contactPhone: '',
                },
            },
            breadcrumbs: [
                { label: 'Home', href: '/' },
                { label: 'Order History', href: '/orders' },
                { label: `Order #${order.orderNumber}` },
            ],
        };
    }
}

