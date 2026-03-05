import { registerAs } from '@nestjs/config';

export default registerAs('sentry', () => ({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.SENTRY_ENABLED === 'true',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(
    process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1',
  ),
  debug: process.env.SENTRY_DEBUG === 'true',
}));
