import { Controller, Get, Render, Session, Res, Param, Query } from '@nestjs/common';
import { Response } from 'express';
import { GetOrderDetailsUseCase } from '../../application/order/use-cases/get-order-details.use-case';
import { GetCustomerOrdersUseCase } from '../../application/order/use-cases/get-customer-orders.use-case';
import { prepareOrderData } from '../helpers/handlebars-helpers';

/**
 * Pages Controller
 * Handles all server-side rendered pages
 */
@Controller()
export class PagesController {
  constructor(
    private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
    private readonly getCustomerOrdersUseCase: GetCustomerOrdersUseCase,
  ) {}

  /**
   * Login Page
   */
  @Get('login')
  @Render('login')
  loginPage(@Query('error') error: string, @Session() session: Record<string, any>) {
    if (session.user) {
      return { redirect: '/dashboard' };
    }
    return {
      title: 'Login',
      error: error === 'invalid_credentials' ? 'Invalid email or password' : null,
    };
  }

  /**
   * Dashboard / Home Page
   */
  @Get(['/', 'dashboard'])
  async dashboardPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    const orders = await this.getCustomerOrdersUseCase.execute(session.user.id);

    return res.render('dashboard', {
      title: 'Dashboard',
      user: session.user,
      recentOrders: orders.slice(0, 5),
    });
  }

  /**
   * Products Listing Page
   */
  @Get('products')
  @Render('products')
  async productsPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    return {
      title: 'Products',
      user: session.user,
      products: this.getMockProducts(),
    };
  }

  /**
   * Product Details Page
   */
  @Get('products/:id')
  @Render('product-details')
  async productDetailsPage(
    @Param('id') id: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (!session.user) {
      return res.redirect('/login');
    }

    const product = this.getMockProductById(id);

    return {
      title: product.name,
      user: session.user,
      product,
    };
  }

  /**
   * Shopping Cart Page
   */
  @Get('cart')
  @Render('cart')
  async cartPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    return {
      title: 'Shopping Cart',
      user: session.user,
      cartItems: session.cart || [],
    };
  }

  /**
   * Checkout Page
   */
  @Get('checkout')
  @Render('checkout')
  async checkoutPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    return {
      title: 'Checkout',
      user: session.user,
      cartItems: session.cart || [],
    };
  }

  /**
   * Order History Page
   */
  @Get('orders')
  @Render('order-history')
  async orderHistoryPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    const orders = await this.getCustomerOrdersUseCase.execute(session.user.id);

    return {
      title: 'Order History',
      user: session.user,
      orders,
    };
  }

  /**
   * Order Details Page
   */
  @Get('orders/:id')
  async orderDetailsPage(
    @Param('id') id: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (!session.user) {
      return res.redirect('/login');
    }

    try {
      const order = await this.getOrderDetailsUseCase.execute(id);
      const data = prepareOrderData(order);

      return res.render('order-details', {
        ...data,
        user: session.user,
      });
    } catch (error) {
      return res.status(404).render('404', {
        title: 'Order Not Found',
        user: session.user,
      });
    }
  }

  /**
   * User Profile Page
   */
  @Get('profile')
  @Render('profile')
  async profilePage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user) {
      return res.redirect('/login');
    }

    return {
      title: 'My Profile',
      user: session.user,
    };
  }

  // Mock data helpers
  private getMockProducts() {
    return [
      {
        id: 'prod-001',
        name: 'Premium Wireless Headphones',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
        rating: 4.5,
        inStock: true,
      },
      {
        id: 'prod-002',
        name: 'Smart Watch Pro',
        price: 399.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        category: 'Electronics',
        rating: 4.8,
        inStock: true,
      },
      {
        id: 'prod-003',
        name: 'Laptop Backpack',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        category: 'Accessories',
        rating: 4.3,
        inStock: true,
      },
    ];
  }

  private getMockProductById(id: string) {
    const products = this.getMockProducts();
    return products.find(p => p.id === id) || products[0];
  }
}
