import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import keycloakConfig from './config/keycloak.config';
import rabbitmqConfig from './config/rabbitmq.config';

// Controllers
import { AppController } from './app.controller';

// Middleware
import { ViewUserMiddleware } from './common/middleware/view-user.middleware';

// Modules (to be imported as implemented)
import { IdentityModule } from './modules/identity/identity.module';
// import { LandingCmsModule } from './modules/landing-cms/landing-cms.module';
import { OrderManagementModule } from './modules/order-management/order-management.module';
import { ProductCatalogModule } from './modules/product-catalog/product-catalog.module';
import { MessagingModule } from './shared/infrastructure/messaging/messaging.module';
import { EntityChangeSubscriber } from './shared/infrastructure/subscribers/entity-change.subscriber';
import { UnitOfWorkModule } from './shared/infrastructure/uow/unit-of-work.module';

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
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {

        const host = configService.get<string>('DATABASE_HOST') || 'localhost';
        const port = configService.get<string>('DATABASE_PORT') || '5432';
        const username = configService.get<string>('DATABASE_USER') || 'ecommerce';
        const password = configService.get<string>('DATABASE_PASSWORD') || 'ecommerce_password';
        const database = configService.get<string>('DATABASE_NAME') || 'b2b_ecommerce';

        // Log connection details (without password) for debugging
        console.log(`[TypeORM] Connecting to database: ${host}:${port}/${database} as ${username}`);

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          subscribers: [EntityChangeSubscriber],
          synchronize: false, // Use migrations only
          logging: process.env.NODE_ENV === 'development',
          ssl: false,
          // Connection pool settings
          extra: {
            max: configService.get<string>('DATABASE_MAX_CONNECTIONS') || 10,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
          // Retry settings
          retryAttempts: configService.get<string>('DATABASE_RETRY_ATTEMPTS') || 3,
          retryDelay: configService.get<string>('DATABASE_RETRY_DELAY') || 3000,
        } as unknown as TypeOrmModuleOptions;
      },
    }),

    // Messaging (RabbitMQ - global, for event publishing)
    MessagingModule,

    // Unit of Work (global, provides transactional boundaries with event collection)
    UnitOfWorkModule,

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
  providers: [ViewUserMiddleware],
})
export class AppModule implements NestModule {
  // Note: ViewUserMiddleware can inject KeycloakAuthService because IdentityModule exports it
  configure(consumer: MiddlewareConsumer) {
    // Apply ViewUserMiddleware to all routes to attach user info for views
    consumer.apply(ViewUserMiddleware).forRoutes('*');
  }
}
