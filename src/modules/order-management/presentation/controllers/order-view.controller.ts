import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id.query';
import { GetOrderHistoryQuery } from '../../application/queries/get-order-history.query';
import { CartPresenter } from '../presenters/cart.presenter';

/**
 * OrderViewController
 *
 * Handles HTML view rendering for order pages.
 * Separate from OrderController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /orders - Order history page
 * - GET /orders/:id - Order detail page
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderViewController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly cartPresenter: CartPresenter,
    ) { }

    /**
     * Order history page
     * GET /orders
     */
    @Get()
    async getOrderHistory(
        @Req() req: any,
        @Res() res: Response,
        @Query('page') page?: string | number,
        @Query('limit') limit?: string | number,
    ): Promise<void> {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;

        if (!userId) {
            return res.status(401).redirect('/login');
        }

        // Ensure page and limit are valid numbers with defaults
        let pageNum = page ? Number(page) : 1;
        let limitNum = limit ? Number(limit) : 10;

        if (isNaN(pageNum) || pageNum < 1) {
            pageNum = 1;
        }
        if (isNaN(limitNum) || limitNum < 1) {
            limitNum = 10;
        }
        if (limitNum > 100) {
            limitNum = 100;
        }

        const query = new GetOrderHistoryQuery(userId, pageNum, limitNum);
        const orderHistory = await this.queryBus.execute(query);

        const viewModel = this.cartPresenter.toOrderHistoryViewModel(
            orderHistory.data,
            orderHistory.page,
            orderHistory.limit,
            orderHistory.total,
        );

        return res.render('orders', viewModel);
    }

    /**
     * Order detail page
     * GET /orders/:id
     */
    @Get(':id')
    async getOrderDetail(
        @Param('id', UuidValidationPipe) id: string,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const userId = req.user?.userId || req.user?.sub || req.user?.id;

        if (!userId) {
            return res.status(401).redirect('/login');
        }

        try {
            const query = new GetOrderByIdQuery(id, userId);
            const order = await this.queryBus.execute(query);

            const viewModel = await this.cartPresenter.toOrderDetailViewModel(order);

            return res.render('order-detail', viewModel);
        } catch (error: any) {
            if (error.status === 404) {
                return res.status(404).render('error', {
                    message: 'Order not found',
                    breadcrumbs: [
                        { label: 'Home', href: '/' },
                        { label: 'Orders', href: '/orders' },
                    ],
                });
            }
            throw error;
        }
    }
}

