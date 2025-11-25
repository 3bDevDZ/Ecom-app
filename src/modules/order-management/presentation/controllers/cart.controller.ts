import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import {
    AddToCartCommand,
    ClearCartCommand,
    RemoveFromCartCommand,
    UpdateCartItemCommand,
} from '../../application/commands';
import { CartDto } from '../../application/dtos/cart.dto';
import { GetCartQuery } from '../../application/queries/get-cart.query';

/**
 * CartController
 *
 * REST API endpoints for shopping cart management.
 * Handles HTTP requests and delegates to CQRS command/query handlers.
 *
 * User Story 2: Add Products to Cart and Checkout
 */
@ApiTags('Cart')
@Controller('api/cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    /**
     * Get current user's cart
     * GET /cart
     */
    @Get()
    @ApiOperation({ summary: 'Get current cart' })
    @ApiResponse({ status: 200, description: 'Cart retrieved successfully', type: CartDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getCart(
        @Req() req: any,
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<CartDto | void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            if (res) {
                res.status(401).json({ error: 'User ID not found in request' });
                return; // Return void when manually handling response
            }
            throw new Error('User ID not found in request');
        }

        const query = new GetCartQuery(userId);
        const cart = await this.queryBus.execute(query);

        // Check if JSON is explicitly requested
        const acceptHeader = req.headers?.accept || '';
        const wantsJson = format === 'json' || acceptHeader.includes('application/json');
        const wantsHtml = format === 'html' || (acceptHeader.includes('text/html') && !wantsJson);

        // Return HTML view if format=html or Accept header prefers HTML
        if (wantsHtml && res) {
            // TODO: Implement cart view presenter
            return res.render('cart', { cart, user: req.user });
        }

        // Return JSON for API - return empty cart structure if cart is null
        const cartDto: CartDto = !cart
            ? {
                  id: null,
                  userId: userId,
                  status: 'active',
                  items: [],
                  totalAmount: 0,
                  itemCount: 0,
                  createdAt: null,
                  updatedAt: null,
              }
            : cart;

        // If res is provided, explicitly send JSON response
        if (res) {
            res.setHeader('Content-Type', 'application/json');
            res.json(cartDto);
            return; // Return void when manually handling response
        }

        // Otherwise, return the DTO and let NestJS serialize it
        return cartDto;
    }

    /**
     * Add item to cart
     * POST /cart/items
     */
    @Post('items')
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiResponse({ status: 200, description: 'Item added to cart successfully', type: CartDto })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 409, description: 'Insufficient inventory or MOQ not met' })
    async addToCart(
        @Req() req: any,
        @Body()
        body: {
            productId: string;
            variantId?: string;
            quantity: number;
        },
    ): Promise<CartDto> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const command = new AddToCartCommand(
            userId,
            body.productId,
            body.quantity,
            body.variantId,
        );

        const cart = await this.commandBus.execute(command);
        return cart;
    }

    /**
     * Update cart item quantity
     * PUT /cart/items/:itemId
     */
    @Put('items/:itemId')
    @ApiOperation({ summary: 'Update cart item quantity' })
    @ApiResponse({ status: 200, description: 'Item updated successfully', type: CartDto })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    @ApiResponse({ status: 409, description: 'Insufficient inventory or MOQ not met' })
    async updateCartItem(
        @Req() req: any,
        @Param('itemId', UuidValidationPipe) itemId: string,
        @Body() body: { quantity: number },
    ): Promise<CartDto> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const command = new UpdateCartItemCommand(userId, itemId, body.quantity);
        const cart = await this.commandBus.execute(command);
        return cart;
    }

    /**
     * Remove item from cart
     * DELETE /cart/items/:itemId
     */
    @Delete('items/:itemId')
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiResponse({ status: 200, description: 'Item removed successfully', type: CartDto })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async removeFromCart(
        @Req() req: any,
        @Param('itemId', UuidValidationPipe) itemId: string,
    ): Promise<CartDto> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const command = new RemoveFromCartCommand(userId, itemId);
        const cart = await this.commandBus.execute(command);
        return cart;
    }

    /**
     * Clear entire cart
     * POST /cart/clear
     */
    @Post('clear')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Clear entire cart' })
    @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
    async clearCart(@Req() req: any): Promise<void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const command = new ClearCartCommand(userId);
        await this.commandBus.execute(command);
    }
}

