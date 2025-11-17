import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as hbs from 'hbs';
import { handlebarsHelpers } from './infrastructure/helpers/handlebars-helpers';

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure view engine (Handlebars)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Register Handlebars partials
  hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));

  // Register Handlebars helpers
  Object.keys(handlebarsHelpers).forEach((helperName) => {
    hbs.registerHelper(helperName, handlebarsHelpers[helperName]);
  });

  // Serve static assets
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable CORS for API endpoints
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4200'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce order management API with hexagonal architecture')
    .setVersion('1.0')
    .addTag('orders')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🛒 Order Details Page: http://localhost:${port}/orders/ORD-2024-001`);
}

bootstrap();
