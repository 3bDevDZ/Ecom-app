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
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { PlaceOrderCommand } from '../../application/commands/place-order.command';
import { ReorderCommand } from '../../application/commands/reorder.command';
import { OrderDto } from '../../application/dtos/order.dto';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id.query';
import { GetOrderByNumberQuery } from '../../application/queries/get-order-by-number.query';
import { GetOrderHistoryQuery } from '../../application/queries/get-order-history.query';
import { AddressProps } from '../../domain/value-objects/address';
import { ReceiptService } from '../../infrastructure/services/receipt.service';
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
@Controller('api/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly cartPresenter: CartPresenter,
        private readonly receiptService: ReceiptService,
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
        @Query('page') page?: string | number,
        @Query('limit') limit?: string | number,
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<PaginatedResponse<OrderDto> | void> {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;

        // Debug logging
        console.log('[OrderController] getOrderHistory - req.user:', JSON.stringify(req.user, null, 2));
        console.log('[OrderController] getOrderHistory - userId extracted:', userId);
        console.log('[OrderController] getOrderHistory - session:', req.session?.accessToken ? 'has token' : 'no token');

        if (!userId) {
            console.error('[OrderController] getOrderHistory - User ID not found in request');
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        // Ensure page and limit are valid numbers with defaults
        let pageNum = page ? Number(page) : 1;
        let limitNum = limit ? Number(limit) : 10;

        // Validate and fix pagination parameters (default invalid values instead of throwing)
        if (isNaN(pageNum) || pageNum < 1) {
            pageNum = 1;
        }
        if (isNaN(limitNum) || limitNum < 1) {
            limitNum = 10;
        }
        if (limitNum > 100) {
            limitNum = 100;
        }

        console.log('[OrderController] getOrderHistory - pagination:', { page: pageNum, limit: limitNum });

        const query = new GetOrderHistoryQuery(userId, pageNum, limitNum);
        const orderHistory = await this.queryBus.execute(query);

        console.log('[OrderController] getOrderHistory - Orders found:', orderHistory.total);

        // Return HTML view if format=html
        const isHtmlRequest =
            format === 'html' ||
            res?.req.headers.accept?.includes('text/html') ||
            (res && !res.req.headers.accept?.includes('application/json'));

        if (isHtmlRequest && res) {
            console.log('[OrderController] Rendering HTML view with orderHistory:', {
                dataLength: orderHistory.data.length,
                total: orderHistory.total,
                page: orderHistory.page,
            });

            const viewModel = this.cartPresenter.toOrderHistoryViewModel(
                orderHistory.data,
                orderHistory.page,
                orderHistory.limit,
                orderHistory.total,
            );

            console.log('[OrderController] View model prepared:', {
                ordersCount: viewModel.orders?.length || 0,
                total: viewModel.pagination?.total || 0,
            });

            return res.render('orders', viewModel);
        }

        // Return JSON for API
        return orderHistory;
    }

    /**
     * Debug endpoint to check current user ID
     * GET /api/orders/debug/user-id
     */
    @Get('debug/user-id')
    @ApiOperation({ summary: 'Debug: Get current user ID' })
    async debugUserId(@Req() req: any): Promise<any> {
        return {
            user: req.user,
            userId: req.user?.userId || req.user?.sub || req.user?.id,
            session: req.session?.accessToken ? 'has token' : 'no token',
            sessionUser: req.session?.user,
        };
    }

    /**
     * Download receipt for an order
     * GET /orders/:id/receipt
     *
     * Downloads the PDF receipt for the specified order.
     * This route must come before @Get(':id') to avoid route conflicts.
     */
    @Get(':id/receipt')
    @ApiOperation({ summary: 'Download order receipt' })
    @ApiResponse({
        status: 200,
        description: 'Receipt downloaded successfully',
        content: {
            'application/pdf': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Receipt not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async downloadReceipt(
        @Param('id') id: string,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        // Check if id is a UUID or order number
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        // Get order to verify ownership and get order number
        let order;
        if (isUuid) {
            const query = new GetOrderByIdQuery(id, userId);
            order = await this.queryBus.execute(query);
        } else {
            const query = new GetOrderByNumberQuery(id, userId);
            order = await this.queryBus.execute(query);
        }

        if (!order) {
            throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
        }

        // Download receipt from MinIO
        const receiptBuffer = await this.receiptService.downloadReceipt(order.orderNumber, order.id);

        if (!receiptBuffer) {
            throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="receipt-${order.orderNumber}.pdf"`,
        );
        res.setHeader('Content-Length', receiptBuffer.length.toString());

        // Send PDF
        res.send(receiptBuffer);
    }

    /**
     * Get order details by ID
     * GET /orders/:id
     *
     * Returns detailed information about a specific order.
     * User Story 3: View and Track Orders
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID or order number' })
    @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html' })
    @ApiResponse({
        status: 200,
        description: 'Order retrieved successfully',
        type: OrderDto,
    })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getOrderById(
        @Param('id') id: string,
        @Req() req: any,
        @Query('format') format?: string,
        @Res() res?: Response,
    ): Promise<OrderDto | void> {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;

        console.log(`[OrderController] getOrderById - Request for order ${id}, userId: ${userId}`);

        if (!userId) {
            console.error(`[OrderController] getOrderById - User ID not found`);
            throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
        }

        try {
            // Check if id is a UUID or order number
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            let order;
            if (isUuid) {
                const query = new GetOrderByIdQuery(id, userId);
                console.log(`[OrderController] getOrderById - Executing query for order ID ${id}`);
                order = await this.queryBus.execute(query);
            } else {
                const query = new GetOrderByNumberQuery(id, userId);
                console.log(`[OrderController] getOrderById - Executing query for order number ${id}`);
                order = await this.queryBus.execute(query);
            }
            console.log(`[OrderController] getOrderById - Order retrieved successfully: ${order.orderNumber}`);

            // Determine if this is an HTML request (browser navigation) or JSON request (API)
            const acceptHeader = req.headers?.accept || '';
            const isExplicitJsonRequest = format === 'json' || acceptHeader.includes('application/json');
            const isHtmlRequest = !isExplicitJsonRequest && res;

            if (isHtmlRequest) {
                // Render HTML page for browser navigation
                const viewModel = this.cartPresenter.toOrderDetailViewModel(order);
                res.render('order-detail', viewModel);
                return;
            }

            // Return JSON for API requests
            if (res) {
                res.json(order);
                return;
            }

            // If no response object, return order (NestJS will serialize automatically)
            return order;
        } catch (error: any) {
            console.error(`[OrderController] getOrderById - Error getting order ${id}:`, error.message);
            console.error(`[OrderController] getOrderById - Error stack:`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            // Throw an exception - NestJS will handle the response
            throw new HttpException(
                {
                    message: 'Failed to retrieve order',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
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
        @Param('id') id: string,
        @Req() req: any,
        @Res() res?: Response,
    ): Promise<{ cartId: string } | void> {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;

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

