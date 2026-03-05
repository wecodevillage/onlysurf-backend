import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('sentry.dsn');
    const enabled = this.configService.get<boolean>('sentry.enabled');
    const environment = this.configService.get<string>('sentry.environment');
    const tracesSampleRate = this.configService.get<number>(
      'sentry.tracesSampleRate',
    );
    const profilesSampleRate = this.configService.get<number>(
      'sentry.profilesSampleRate',
    );
    const debug = this.configService.get<boolean>('sentry.debug');

    if (!enabled || !dsn) {
      this.logger.log('Sentry is disabled or DSN not configured');
      return;
    }

    Sentry.init({
      dsn,
      environment,
      tracesSampleRate,
      profilesSampleRate,
      debug,
      integrations: [nodeProfilingIntegration()],
    });

    this.logger.log(`Sentry initialized for environment: ${environment}`);
  }

  captureException(exception: any, context?: Record<string, any>) {
    if (context) {
      Sentry.setContext('additional', context);
    }
    Sentry.captureException(exception);
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  }

  clearUser() {
    Sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  setTag(key: string, value: string | number | boolean) {
    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
  }
}
