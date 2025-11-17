import { Module } from '@nestjs/common';
import { OrderModule } from './infrastructure/order.module';

/**
 * Root Application Module
 */
@Module({
  imports: [OrderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
