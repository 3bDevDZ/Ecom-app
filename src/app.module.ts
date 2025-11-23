import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import keycloakConfig from './config/keycloak.config';
import rabbitmqConfig from './config/rabbitmq.config';

// Controllers
import { AppController } from './app.controller';

// Middleware
import { RouteProxyMiddleware } from './common/middleware/route-proxy.middleware';
import { ViewUserMiddleware } from './common/middleware/view-user.middleware';

// Modules (to be imported as implemented)
import { IdentityModule } from './modules/identity/identity.module';
// import { LandingCmsModule } from './modules/landing-cms/landing-cms.module';
import { OrderManagementModule } from './modules/order-management/order-management.module';
import { ProductCatalogModule } from './modules/product-catalog/product-catalog.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, keycloakConfig, rabbitmqConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER || 'ecommerce',
        password: process.env.DATABASE_PASSWORD || 'ecommerce_password',
        database: process.env.DATABASE_NAME || 'b2b_ecommerce',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations only
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // CQRS
    CqrsModule.forRoot(),

    // Scheduling (for outbox processor)
    ScheduleModule.forRoot(),

    // Bounded Context Modules (uncomment as implemented)
    IdentityModule,
    // LandingCmsModule,
    ProductCatalogModule,
    OrderManagementModule,
  ],
  controllers: [AppController],
  providers: [ViewUserMiddleware, RouteProxyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply ViewUserMiddleware to all routes to attach user info for views
    consumer.apply(ViewUserMiddleware).forRoutes('*');

    // Apply RouteProxyMiddleware to handle route proxying
    consumer.apply(RouteProxyMiddleware).forRoutes('*');
  }
}
