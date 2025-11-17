import { Controller, Get, Param, Render, NotFoundException } from '@nestjs/common';
import { GetOrderDetailsUseCase } from '../../application/order/use-cases/get-order-details.use-case';
import { prepareOrderData } from '../helpers/handlebars-helpers';

/**
 * View Controller
 * Handles server-side rendering of pages
 */
@Controller()
export class ViewController {
  constructor(
    private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
  ) {}

  /**
   * Render order details page
   */
  @Get('orders/:id')
  @Render('order-details')
  async getOrderDetailsPage(@Param('id') id: string) {
    try {
      const order = await this.getOrderDetailsUseCase.execute(id);
      return prepareOrderData(order);
    } catch (error) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  /**
   * Default route - redirect to demo order
   */
  @Get()
  @Render('order-details')
  async getHomePage() {
    const order = await this.getOrderDetailsUseCase.execute('ORD-2024-001');
    return prepareOrderData(order);
  }
}
