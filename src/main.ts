import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Handlebars view engine
  app.setBaseViewsDir(join(__dirname, '..', 'src', 'views'));
  app.setViewEngine('hbs');

  // API prefix
  app.setGlobalPrefix('api', {
    exclude: ['/', '/health', '/login', '/logout', '/callback'],
  });

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
