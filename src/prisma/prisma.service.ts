import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

function buildConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const url = new URL(raw);
  url.searchParams.delete('channel_binding');
  return url.toString();
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    neonConfig.webSocketConstructor = ws;

    const connectionString = buildConnectionString();
    const adapter = new PrismaNeon({ connectionString });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Neon database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  enableShutdownHooks() {
    process.on('beforeExit', () => {
      void this.$disconnect();
    });
  }

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
