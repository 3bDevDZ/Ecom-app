import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import { GetCartQuery } from '../../application/queries/get-cart.query';

/**
 * CartViewController
 *
 * Handles HTML view rendering for cart page.
 * Separate from CartController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /cart - Cart page
 */
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartViewController {
  constructor(
    private readonly queryBus: QueryBus,
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
    const cart = await this.queryBus.execute(query);

    return res.render('cart', { cart, user: req.user });
  }
}

