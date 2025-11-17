import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { handlebarsHelpers } from './infrastructure/helpers/handlebars-helpers';

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'ecommerce-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // Configure view engine (Express Handlebars with layouts)
  const viewsPath = join(__dirname, 'views');
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.engine('hbs', engine({
    extname: '.hbs',
    layoutsDir: join(viewsPath, 'layouts'),
    partialsDir: join(viewsPath, 'partials'),
    defaultLayout: 'base',
    helpers: handlebarsHelpers,
  }));

  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');

  // Serve static assets
  app.useStaticAssets(join(__dirname, 'public'));

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

  // Try to get port from multiple sources in order of preference
  const portFromArgs = process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1];
  const port = parseInt(portFromArgs || '') || 
               parseInt(process.env.PORT || '') || 
               parseInt(process.env['nx.raw.port'] || '') || 
               3333;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔐 Login Page: http://localhost:${port}/login`);
  console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
  console.log(`🛒 Order Details: http://localhost:${port}/orders/ORD-2024-001\n`);
}

bootstrap();
