import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { GetCartQuery } from '../../application/queries/get-cart.query';
import { CartPresenter } from '../presenters/cart.presenter';

/**
 * CheckoutViewController
 *
 * Handles HTML view rendering for checkout page.
 * Shows cart items in a table format with ability to edit quantities.
 *
 * Routes:
 * - GET /checkout - Checkout page (cart review with editable items)
 */
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutViewController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly cartPresenter: CartPresenter,
  ) { }

  /**
   * Checkout page
   * GET /checkout
   */
  @Get()
  async getCheckout(
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      return res.status(401).redirect('/login');
    }

    const query = new GetCartQuery(userId);
    const cartDto = await this.queryBus.execute(query);

    // If cart is empty, redirect to products
    if (!cartDto || cartDto.items.length === 0) {
      return res.redirect('/products');
    }

    const viewModel = await this.cartPresenter.buildCheckoutViewModel(cartDto, req.user);

    return res.render('checkout', viewModel);
  }
}

