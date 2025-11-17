import { Module } from '@nestjs/common';
import { OrderModule } from './infrastructure/order.module';
import { AuthModule } from './infrastructure/auth.module';
import { PagesModule } from './infrastructure/pages.module';

/**
 * Root Application Module
 */
@Module({
  imports: [OrderModule, AuthModule, PagesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
