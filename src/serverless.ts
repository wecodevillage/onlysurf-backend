import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
  INestApplication,
  VersioningType,
} from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';

export const app = express();

let nestApp: INestApplication | undefined;

async function createNestApp(): Promise<INestApplication> {
  if (!nestApp) {
    const logger = new Logger('Vercel');

    nestApp = await NestFactory.create(AppModule, new ExpressAdapter(app), {
      logger: ['error', 'warn', 'log'],
      rawBody: true,
    });

    // Enable CORS
    nestApp.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['*'],
      credentials: true,
    });

    // Global validation
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // URI Versioning - Controllers decorated with @Version will be prefixed
    // e.g., @Version('1') -> /v1/resource
    // To create v2, add @Version('2') to new controllers or override specific routes
    nestApp.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await nestApp.init();
    logger.log('NestJS app initialized for Vercel');
  }

  return nestApp;
}

// Vercel serverless function handler
export default async (req: any, res: any): Promise<void> => {
  await createNestApp();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
  return app(req, res);
};
