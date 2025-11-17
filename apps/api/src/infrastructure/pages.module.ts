import { Module } from '@nestjs/common';
import { PagesController } from './http/pages.controller';
import { OrderModule } from './order.module';

/**
 * Pages Module
 * Handles all server-side rendered pages
 */
@Module({
  imports: [OrderModule],
  controllers: [PagesController],
})
export class PagesModule {}
