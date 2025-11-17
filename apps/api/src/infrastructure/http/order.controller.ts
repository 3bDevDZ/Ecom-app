import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetOrderDetailsUseCase } from '../../application/order/use-cases/get-order-details.use-case';
import { GetCustomerOrdersUseCase } from '../../application/order/use-cases/get-customer-orders.use-case';
import { OrderResponseDto } from '../../application/order/dtos/order.dto';

/**
 * Order Controller (HTTP Adapter)
 * Handles HTTP requests for order-related operations
 */
@ApiTags('orders')
@Controller('api/orders')
export class OrderController {
  constructor(
    private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
    private readonly getCustomerOrdersUseCase: GetCustomerOrdersUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.getOrderDetailsUseCase.execute(id);
  }

  @Get('customer/:customerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all orders for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer orders retrieved successfully',
    type: [OrderResponseDto],
  })
  async getCustomerOrders(
    @Param('customerId') customerId: string,
  ): Promise<OrderResponseDto[]> {
    return this.getCustomerOrdersUseCase.execute(customerId);
  }
}
