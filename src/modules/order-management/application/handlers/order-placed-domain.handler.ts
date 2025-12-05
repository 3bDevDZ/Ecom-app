import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderPlaced } from '../../domain/events/order-placed';
import { CART_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { ICartRepository } from '../../domain/repositories/icart-repository';

/**
 * Domain Event Handler: OrderPlaced -> Cart Conversion
 *
 * This handler runs within the same transaction as order placement.
 * It converts the cart when an order is placed, following separation of concerns.
 * The repository automatically uses the transaction's EntityManager.
 */
@Injectable()
@EventsHandler(OrderPlaced)
export class OrderPlacedCartConverterHandler implements IEventHandler<OrderPlaced> {
    private readonly logger = new Logger(OrderPlacedCartConverterHandler.name);

    constructor(
        @Inject(CART_REPOSITORY_TOKEN)
        private readonly cartRepository: ICartRepository,
    ) { }

    async handle(event: OrderPlaced): Promise<void> {
        const { cartId } = event.payload;

        this.logger.debug(`Converting cart ${cartId} after order placement`);

        try {
            // Load cart within the same transaction (automatically uses UoW's manager)
            const cart = await this.cartRepository.findById(cartId);

            if (!cart) {
                this.logger.warn(`Cart ${cartId} not found for conversion`);
                return;
            }

            // Convert the cart (this will change its status to CONVERTED)
            cart.convert();

            // Save the converted cart within the same transaction (automatically uses UoW's manager)
            await this.cartRepository.save(cart);

            this.logger.debug(`Cart ${cartId} successfully converted`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to convert cart ${cartId}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined);
            // Re-throw to ensure transaction rollback
            throw error;
        }
    }
}

