import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { FirebaseAuthGuard } from '../../src/auth/firebase-auth.guard';
import { MuxService } from '../../src/media/mux.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestAuthGuard } from './test-auth.guard';
import { cleanDatabase } from './db.helper';
import type { App as SupertestApp } from 'supertest/types';

// Mock MuxService to avoid external API calls
const mockMuxService = {
  createDirectUpload: jest.fn().mockResolvedValue({
    uploadUrl: 'https://storage.googleapis.com/mux-uploads/test',
    uploadId: 'test-upload-id',
  }),
  getAsset: jest.fn().mockResolvedValue({
    id: 'test-asset-id',
    playback_ids: [{ id: 'test-playback-id' }],
    status: 'ready',
  }),
  deleteAsset: jest.fn().mockResolvedValue(undefined),
  handleWebhook: jest.fn().mockResolvedValue(undefined),
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
};

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  /** Pre-bound supertest agent with base URL */
  request: ReturnType<typeof request.agent>;
  module: TestingModule;
}

/**
 * Bootstrap a NestJS test application with overridden guards and external services.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(FirebaseAuthGuard)
    .useClass(TestAuthGuard)
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .overrideProvider(MuxService)
    .useValue(mockMuxService)
    .compile();

  const app = moduleRef.createNestApplication({ rawBody: true });

  // Match production app configuration
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.init();

  const prisma = moduleRef.get(PrismaService);

  return {
    app,
    prisma,
    request: request.agent(app.getHttpServer() as SupertestApp),
    module: moduleRef,
  };
}

/**
 * Clean up a test application: wipe DB and close the app.
 */
export async function destroyTestApp(ctx: TestContext): Promise<void> {
  await cleanDatabase(ctx.prisma);
  await ctx.app.close();
}

/**
 * Returns headers object that authenticates requests as the given user.
 */
export function authHeaders(userId: string): Record<string, string> {
  return { 'x-test-user-id': userId };
}
