import { Controller, Get, Render } from '@nestjs/common';

/**
 * Application Root Controller
 * 
 * Handles basic health checks and root landing page
 */
@Controller()
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'b2b-ecommerce-api',
      version: '1.0.0',
    };
  }

  @Get()
  @Render('pages/home')
  root() {
    return {
      title: 'B2B E-Commerce Platform',
      message: 'Welcome to the B2B E-Commerce Platform',
    };
  }
}

