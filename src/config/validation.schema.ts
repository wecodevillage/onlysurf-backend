import * as Joi from 'joi';

export const validationSchema: Joi.ObjectSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),
  CORS_ORIGINS: Joi.string().required(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Firebase
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),

  // Mux
  MUX_TOKEN_ID: Joi.string().required(),
  MUX_TOKEN_SECRET: Joi.string().required(),
  MUX_WEBHOOK_SECRET: Joi.string().required(),

  // Redis
  UPSTASH_REDIS_URL: Joi.string().uri().required(),
  UPSTASH_REDIS_TOKEN: Joi.string().required(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),
  STRIPE_PRICE_COACH_STARTER_MONTHLY: Joi.string().required(),
  STRIPE_PRICE_COACH_STARTER_ANNUAL: Joi.string().required(),
  STRIPE_PRICE_COACH_PRO_MONTHLY: Joi.string().required(),
  STRIPE_PRICE_COACH_PRO_ANNUAL: Joi.string().required(),
  STRIPE_PRICE_ACADEMY_MONTHLY: Joi.string().required(),
  STRIPE_PRICE_ACADEMY_ANNUAL: Joi.string().required(),
  STRIPE_PRICE_PRO_SURFER_MONTHLY: Joi.string().required(),
  STRIPE_PRICE_PRO_SURFER_ANNUAL: Joi.string().required(),

  // Resend
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().email().required(),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Sentry
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_ENABLED: Joi.boolean().default(false),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  SENTRY_DEBUG: Joi.boolean().default(false),

  // Session Archive
  SESSION_ARCHIVE_DAYS: Joi.number().default(30),
});
