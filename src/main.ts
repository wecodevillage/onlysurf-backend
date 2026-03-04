import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create app with raw body for webhooks
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  // CORS configuration
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // URI Versioning - Controllers decorated with @Version will be prefixed
  // e.g., @Version('1') -> /v1/resource
  // To create v2, add @Version('2') to new controllers or override specific routes
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
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

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('OnlySurf API')
    .setDescription('Surf coaching and progression platform API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Firebase ID token',
        in: 'header',
      },
      'firebase-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Authentication', 'User authentication and profile management')
    .addTag('Academies', 'Surf academy management')
    .addTag('Athletes', 'Athlete management and statistics')
    .addTag('Sessions', 'Training session management')
    .addTag('Waves', 'Wave clips and analysis')
    .addTag('Saved Waves', 'Athlete personal wave archive')
    .addTag('Media', 'Video upload and processing (Mux)')
    .addTag('Billing', 'Subscription and payment management (Stripe)')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.onlysurf.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'OnlySurf API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Shutdown hooks
  app.enableShutdownHooks();

  // Start server
  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  await app.listen(port);

  logger.log(`🚀 OnlySurf API running on: http://localhost:${port}/v1`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📊 Health check: http://localhost:${port}/v1/health`);
  logger.log(`📖 API Docs: http://localhost:${port}/api`);
}

void bootstrap();
