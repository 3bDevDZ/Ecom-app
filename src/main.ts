import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupHandlebarsEngine } from './config/handlebars.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Configure express-session for OAuth flow and user session management
  app.use(
    session({
      secret: configService.get<string>('app.sessionSecret') || 'change-me-in-production',
      resave: false,
      saveUninitialized: true, // Save session even if unmodified (needed for PKCE state)
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
      name: 'b2b-ecommerce.sid', // Session cookie name
    }),
  );

  // Global exception filter - handles 401 redirects for HTML requests
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Static assets
  app.useStaticAssets(join(__dirname, 'public'));

  // Setup Handlebars view engine with atomic design partials
  const viewsPath = join(__dirname, 'views');
  setupHandlebarsEngine(app, viewsPath);

  // No global prefix - API controllers add /api prefix manually
  // Separation of concerns:
  // - View Controllers: Handle HTML views (no prefix)
  //   - /products, /products/:id → ProductViewController
  //   - /categories, /categories/:id → CategoryViewController
  //   - /cart → CartViewController
  //   - /orders, /orders/:id → OrderViewController
  // - API Controllers: Handle JSON responses (with /api prefix in controller)
  //   - /api/products, /api/products/:id → ProductController
  //   - /api/categories, /api/categories/:id → CategoryController
  //   - /api/cart → CartController
  //   - /api/orders, /api/orders/:id → OrderController

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('B2B E-Commerce Platform API')
    .setDescription('API documentation for the B2B E-Commerce Platform with Clean Architecture, DDD, and CQRS')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Authentication and authorization endpoints')
    .addTag('Products', 'Product catalog management')
    .addTag('Categories', 'Category management')
    .addTag('Orders', 'Order management')
    .addTag('Landing CMS', 'Landing page content management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3333'],
    credentials: true,
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📝 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
