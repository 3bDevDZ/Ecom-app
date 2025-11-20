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
  @Render('components/pages/homepage')
  root() {
    return {
      title: 'B2B E-Commerce Platform',
      features: [
        {
          icon: '📦',
          title: 'Inventory Management',
          description: 'Real-time inventory tracking and automated reordering systems',
        },
        {
          icon: '📊',
          title: 'Analytics Dashboard',
          description: 'Comprehensive reporting and business intelligence insights',
        },
        {
          icon: '🔗',
          title: 'Supplier Integration',
          description: 'Seamless integration with suppliers and vendor management',
        },
        {
          icon: '💰',
          title: 'Pricing Management',
          description: 'Dynamic pricing rules and quote management systems',
        },
        {
          icon: '📱',
          title: 'Mobile Ready',
          description: 'Responsive design optimized for all devices and platforms',
        },
        {
          icon: '🔐',
          title: 'Enterprise Security',
          description: 'Bank-grade security with role-based access controls',
        },
      ],
    };
  }
}
