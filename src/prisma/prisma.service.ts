import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Configure WebSocket for local development
    if (process.env.NODE_ENV === 'development') {
      neonConfig.webSocketConstructor = ws;
    }

    // Create Neon serverless connection pool
    const connectionString = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString });
    // @ts-expect-error - Neon Pool type compatibility with Prisma adapter
    const adapter = new PrismaNeon(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Neon database via serverless driver');

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma query event type not properly exported
      this.$on('query' as any, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // @ts-expect-error - Prisma error event type not properly exported
    this.$on('error' as any, (e: any) => {
      this.logger.error(`Database error: ${e.message}`);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Enable soft deletes by default
   */
  enableShutdownHooks() {
    process.on('beforeExit', () => {
      void this.$disconnect();
    });
  }

  /**
   * Clean database for testing
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof typeof this];
        if (
          typeof model === 'object' &&
          model !== null &&
          'deleteMany' in model
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return (model as any).deleteMany();
        }
      }),
    );
  }
}
