import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Force test environment
process.env.NODE_ENV = 'test';

// Provide fallback values for required env vars (CI / environments without .env)
const defaults: Record<string, string> = {
  CORS_ORIGINS: 'http://localhost:3000',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_PRIVATE_KEY:
    '-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRiMLAH\n-----END RSA PRIVATE KEY-----',
  FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
  MUX_TOKEN_ID: 'test-mux-token-id',
  MUX_TOKEN_SECRET: 'test-mux-token-secret',
  MUX_WEBHOOK_SECRET: 'test-mux-webhook-secret',
  UPSTASH_REDIS_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_TOKEN: 'test-redis-token',
  STRIPE_SECRET_KEY: 'sk_test_dummy_key_for_tests',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy',
  STRIPE_PRICE_COACH_STARTER_MONTHLY: 'price_test_coach_starter_monthly',
  STRIPE_PRICE_COACH_STARTER_ANNUAL: 'price_test_coach_starter_annual',
  STRIPE_PRICE_COACH_PRO_MONTHLY: 'price_test_coach_pro_monthly',
  STRIPE_PRICE_COACH_PRO_ANNUAL: 'price_test_coach_pro_annual',
  STRIPE_PRICE_ACADEMY_MONTHLY: 'price_test_academy_monthly',
  STRIPE_PRICE_ACADEMY_ANNUAL: 'price_test_academy_annual',
  STRIPE_PRICE_PRO_SURFER_MONTHLY: 'price_test_pro_surfer_monthly',
  STRIPE_PRICE_PRO_SURFER_ANNUAL: 'price_test_pro_surfer_annual',
  RESEND_API_KEY: 're_test_dummy_key',
  RESEND_FROM_EMAIL: 'test@onlysurf.com',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
