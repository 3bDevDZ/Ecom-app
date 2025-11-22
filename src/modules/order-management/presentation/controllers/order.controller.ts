import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { PlaceOrderCommand } from '../../application/commands/place-order.command';
import { ReorderCommand } from '../../application/commands/reorder.command';
import { OrderDto } from '../../application/dtos/order.dto';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id.query';
import { GetOrderHistoryQuery } from '../../application/queries/get-order-history.query';
import { AddressProps } from '../../domain/value-objects/address';
import { CartPresenter } from '../presenters/cart.presenter';

/**
 * OrderController
 *
 * REST API endpoints for order management (checkout, placement, history).
 * Handles HTTP requests and delegates to CQRS command/query handlers.
 *
 * User Story 2: Add Products to Cart and Checkout
 * User Story 3: View and Track Orders
 */
@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly cartPresenter: CartPresenter,
    ) { }

    /**
     * Place an order (checkout)
     * POST /orders
     *
     * Takes the user's cart, creates an order, reserves inventory,
     * and sends confirmation email.
     */
    @Post()
    @ApiOperation({ summary: 'Place order (checkout)' })
    @ApiResponse({
        status: 201,
        description: 'Order placed successfully',
        type: OrderDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input or empty cart' })
    @ApiResponse({ status: 409, description: 'Insufficient inventory' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async placeOrder(
        @Req() req: any,
        @Body()
        body: {
            shippingAddress: AddressProps;
            poNumber?: string;
            notes?: string;
        },
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<OrderDto | void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        // Validate shipping address
        if (!body.shippingAddress) {
            throw new HttpException('Shipping address is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const command = new PlaceOrderCommand(
                userId,
                body.shippingAddress,
                body.poNumber,
                body.notes,
            );

            const order = await this.commandBus.execute(command);

            // Return HTML view if format=html
            const isHtmlRequest =
                format === 'html' ||
                res?.req.headers.accept?.includes('text/html') ||
                (res && !res.req.headers.accept?.includes('application/json'));

            if (isHtmlRequest && res) {
                // Redirect to order confirmation page
                return res.redirect(`/orders/${order.orderNumber}`);
            }

            // Return JSON for API
            if (res) {
                res.status(HttpStatus.CREATED).json(order);
                return;
            }
            return order;
        } catch (error) {
            // Handle domain errors
            if (error.message?.includes('Cart is empty')) {
                throw new HttpException('Cannot place order with empty cart', HttpStatus.BAD_REQUEST);
            }
            if (error.message?.includes('Insufficient inventory')) {
                throw new HttpException(error.message, HttpStatus.CONFLICT);
            }
            if (error.message?.includes('Cart not found')) {
                throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
            }
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Get order history for current user
     * GET /orders
     *
     * Returns paginated list of orders for the authenticated user.
     * User Story 3: View and Track Orders
     */
    @Get()
    @ApiOperation({ summary: 'Get order history' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
    @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html' })
    @ApiResponse({
        status: 200,
        description: 'Order history retrieved successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getOrderHistory(
        @Req() req: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<PaginatedResponse<OrderDto> | void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        const query = new GetOrderHistoryQuery(userId, Number(page), Number(limit));
        const orderHistory = await this.queryBus.execute(query);

        // Return HTML view if format=html
        const isHtmlRequest =
            format === 'html' ||
            res?.req.headers.accept?.includes('text/html') ||
            (res && !res.req.headers.accept?.includes('application/json'));

        if (isHtmlRequest && res) {
            const viewModel = this.cartPresenter.toOrderHistoryViewModel(
                orderHistory.data,
                orderHistory.page,
                orderHistory.limit,
                orderHistory.total,
            );
            return res.render('orders', viewModel);
        }

        // Return JSON for API
        return orderHistory;
    }

    /**
     * Get order details by ID
     * GET /orders/:id
     *
     * Returns detailed information about a specific order.
     * User Story 3: View and Track Orders
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html' })
    @ApiResponse({
        status: 200,
        description: 'Order retrieved successfully',
        type: OrderDto,
    })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getOrderById(
        @Param('id', UuidValidationPipe) id: string,
        @Req() req: any,
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<OrderDto | void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        const query = new GetOrderByIdQuery(id, userId);
        const order = await this.queryBus.execute(query);

        // Return HTML view if format=html
        const isHtmlRequest =
            format === 'html' ||
            res?.req.headers.accept?.includes('text/html') ||
            (res && !res.req.headers.accept?.includes('application/json'));

        if (isHtmlRequest && res) {
            const viewModel = this.cartPresenter.toOrderDetailViewModel(order);
            return res.render('order-detail', viewModel);
        }

        // Return JSON for API
        return order;
    }

    /**
     * Reorder from a previous order
     * POST /orders/:id/reorder
     *
     * Creates a new cart with items from the specified order.
     * User Story 3: View and Track Orders
     */
    @Post(':id/reorder')
    @ApiOperation({ summary: 'Reorder from previous order' })
    @ApiResponse({
        status: 201,
        description: 'Cart created successfully from order',
    })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async reorder(
        @Param('id', UuidValidationPipe) id: string,
        @Req() req: any,
        @Res() res?: Response,
    ): Promise<{ cartId: string } | void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        const command = new ReorderCommand(userId, id);
        const cartId = await this.commandBus.execute(command);

        if (res) {
            res.status(HttpStatus.CREATED).json({ cartId });
            return;
        }

        return { cartId };
    }
}

