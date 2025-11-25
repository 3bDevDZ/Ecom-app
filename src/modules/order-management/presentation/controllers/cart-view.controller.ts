import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { GetCartQuery } from '../../application/queries/get-cart.query';
import { CartPresenter } from '../presenters/cart.presenter';

/**
 * CartViewController
 *
 * Handles HTML view rendering for cart page.
 * Separate from CartController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /cart - Cart page (review and edit)
 */
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartViewController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly cartPresenter: CartPresenter,
    ) { }

    /**
     * Cart page
     * GET /cart
     */
    @Get()
    async getCart(
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const userId = req.user?.userId || req.user?.sub;

        if (!userId) {
            return res.status(401).redirect('/login');
        }

        const query = new GetCartQuery(userId);
        const cartDto = await this.queryBus.execute(query);

        const viewModel = await this.cartPresenter.buildCartViewModel(cartDto, req.user);

        return res.render('cart', viewModel);
    }
}

