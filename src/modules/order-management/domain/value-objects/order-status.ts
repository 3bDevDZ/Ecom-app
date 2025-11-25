/**
 * OrderStatus Value Object
 *
 * Represents order status with valid state transitions
 */
export class OrderStatus {
    // Static instances for each status
    static readonly RECEIVED = new OrderStatus('received');
    static readonly IN_CONFIRMATION = new OrderStatus('in_confirmation');
    static readonly CONFIRMED = new OrderStatus('confirmed');
    static readonly IN_SHIPPING = new OrderStatus('in_shipping');
    static readonly SHIPPED = new OrderStatus('shipped');
    static readonly DELIVERED = new OrderStatus('delivered');
    static readonly CANCELLED = new OrderStatus('cancelled');

    // Legacy statuses for backward compatibility
    static readonly PENDING = new OrderStatus('received'); // Map to received
    static readonly PROCESSING = new OrderStatus('in_confirmation'); // Map to in_confirmation

    private constructor(private readonly _value: string) { }

    /**
     * Create OrderStatus from string value
     */
    static fromString(value: string): OrderStatus {
        const statusMap: Record<string, OrderStatus> = {
            received: OrderStatus.RECEIVED,
            in_confirmation: OrderStatus.IN_CONFIRMATION,
            confirmed: OrderStatus.CONFIRMED,
            in_shipping: OrderStatus.IN_SHIPPING,
            shipped: OrderStatus.SHIPPED,
            delivered: OrderStatus.DELIVERED,
            cancelled: OrderStatus.CANCELLED,
            // Legacy compatibility
            pending: OrderStatus.RECEIVED,
            processing: OrderStatus.IN_CONFIRMATION,
        };

        const status = statusMap[value.toLowerCase()];
        if (!status) {
            throw new Error(`Invalid order status: ${value}`);
        }

        return status;
    }

    get value(): string {
        return this._value;
    }

    /**
     * Check if transition to another status is valid
     */
    canTransitionTo(newStatus: OrderStatus): boolean {
        const transitions: Record<string, string[]> = {
            received: ['in_confirmation', 'cancelled'],
            in_confirmation: ['confirmed', 'cancelled'],
            confirmed: ['in_shipping', 'cancelled'],
            in_shipping: ['shipped', 'cancelled'],
            shipped: ['delivered'],
            delivered: [],
            cancelled: [],
            // Legacy compatibility
            pending: ['in_confirmation', 'cancelled'],
            processing: ['confirmed', 'cancelled'],
        };

        const allowedTransitions = transitions[this._value] || [];
        return allowedTransitions.includes(newStatus._value);
    }

    /**
     * Check if this is a terminal status (no further transitions possible)
     */
    isTerminal(): boolean {
        return this._value === 'delivered' || this._value === 'cancelled';
    }

    isReceived(): boolean {
        return this._value === 'received';
    }

    isInConfirmation(): boolean {
        return this._value === 'in_confirmation';
    }

    isConfirmed(): boolean {
        return this._value === 'confirmed';
    }

    isInShipping(): boolean {
        return this._value === 'in_shipping';
    }

    isShipped(): boolean {
        return this._value === 'shipped';
    }

    isDelivered(): boolean {
        return this._value === 'delivered';
    }

    isCancelled(): boolean {
        return this._value === 'cancelled';
    }

    // Legacy methods for backward compatibility
    isPending(): boolean {
        return this._value === 'received';
    }

    isProcessing(): boolean {
        return this._value === 'in_confirmation';
    }

    equals(other: OrderStatus): boolean {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}

