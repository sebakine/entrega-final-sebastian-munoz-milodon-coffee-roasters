import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('CoffeeLinkAPI');
  const app = await NestFactory.create(AppModule);

  // 1. SECURITY HEADERS (Strict Helmet)
  // Protects against XSS, Clickjacking, Sniffing, etc.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], 
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow Swagger UI inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow Swagger UI styles
        imgSrc: ["'self'", "data:", "https:"], // Allow external images (CDN, S3)
        connectSrc: ["'self'", "http://localhost:5173", "https://coffeelink.cl"], // Allow frontend connection
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow frontend to load resources
  }));

  // 2. COOKIE PARSER
  // Essential for HttpOnly Auth Tokens (More secure than localStorage)
  app.use(cookieParser());
  
  // 3. CORS CONFIGURATION (Strict)
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173', 
      'https://coffeelink.cl',
      'https://admin.coffeelink.cl'
    ],
    credentials: true, // Allow sending cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  // 4. GLOBAL PREFIX & VERSIONING
  app.setGlobalPrefix('api/v1');

  // 5. DATA VALIDATION (Strict)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties sent
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. SWAGGER DOCUMENTATION (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('CoffeeLink Ecosystem API')
    .setDescription(
      'The centralized B2B/B2C backend API for the CoffeeLink ecosystem. Includes Marketplace, Auth, Jobs, Academy, and Green Loop modules.',
    )
    .setVersion('1.0')
    .addCookieAuth('Authentication') // Document that we use Cookies
    .addTag('Auth', 'User authentication and session management')
    .addTag('Marketplace', 'Products, Orders, and Cart management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 7. START SERVER
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 CoffeeLink Backend running on port ${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🛡️  Security Level: Enterprise (Strict CSP + CORS + HttpOnly Cookies)`);
}
bootstrap();