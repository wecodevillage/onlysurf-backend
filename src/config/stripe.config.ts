import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  prices: {
    coachStarterMonthly: process.env.STRIPE_PRICE_COACH_STARTER_MONTHLY,
    coachStarterAnnual: process.env.STRIPE_PRICE_COACH_STARTER_ANNUAL,
    coachProMonthly: process.env.STRIPE_PRICE_COACH_PRO_MONTHLY,
    coachProAnnual: process.env.STRIPE_PRICE_COACH_PRO_ANNUAL,
    academyMonthly: process.env.STRIPE_PRICE_ACADEMY_MONTHLY,
    academyAnnual: process.env.STRIPE_PRICE_ACADEMY_ANNUAL,
    proSurferMonthly: process.env.STRIPE_PRICE_PRO_SURFER_MONTHLY,
    proSurferAnnual: process.env.STRIPE_PRICE_PRO_SURFER_ANNUAL,
  },
}));
