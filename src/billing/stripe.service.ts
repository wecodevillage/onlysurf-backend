import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionPlan {
  tier: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  priceId: string | null;
  athletes: number;
  sessions: number;
  videoMinutes: number;
  coaches: number;
  archiveMonths: number;
  features: string[];
}

export interface SubscriptionPlans {
  coach: SubscriptionPlan[];
  athlete: SubscriptionPlan[];
}

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const secretKey = this.configService.get<string>('stripe.secretKey');

    if (!secretKey) {
      throw new Error('Stripe secret key is missing');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    this.logger.log('Stripe client initialized successfully');
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update or create subscription record
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          tier: 'FREE_ATHLETE',
          status: 'ACTIVE',
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(userId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw error;
    }

    // Store webhook event
    await this.prisma.webhookEvent.create({
      data: {
        source: 'STRIPE',
        eventId: event.id,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(event)),
      },
    });

    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    // Mark as processed
    await this.prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!existingSubscription) {
      this.logger.warn(`No subscription found for customer: ${customerId}`);
      return;
    }

    const tier = this.mapPriceIdToTier(subscription.items.data[0]?.price.id);
    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: subscription.id,
        tier,
        status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
    });

    this.logger.log(`Updated subscription for customer: ${customerId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    await this.prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'CANCELED',
        tier: 'FREE_ATHLETE',
      },
    });

    this.logger.log(`Subscription canceled for customer: ${customerId}`);
  }

  private handlePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Payment succeeded for invoice: ${invoice.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    await this.prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'PAST_DUE',
      },
    });

    this.logger.log(`Payment failed for invoice: ${invoice.id}`);
  }

  private mapPriceIdToTier(priceId: string): SubscriptionTier {
    const prices = this.configService.get<any>('stripe.prices');

    if (
      priceId === prices.coachStarterMonthly ||
      priceId === prices.coachStarterAnnual
    ) {
      return 'COACH_STARTER';
    }
    if (
      priceId === prices.coachProMonthly ||
      priceId === prices.coachProAnnual
    ) {
      return 'COACH_PRO';
    }
    if (priceId === prices.academyMonthly || priceId === prices.academyAnnual) {
      return 'ACADEMY';
    }
    if (
      priceId === prices.proSurferMonthly ||
      priceId === prices.proSurferAnnual
    ) {
      return 'PRO_SURFER';
    }

    return 'FREE_ATHLETE';
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE',
      trialing: 'TRIALING',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      unpaid: 'UNPAID',
    };

    return statusMap[status] || 'ACTIVE';
  }

  getPlans(): SubscriptionPlans {
    const prices = this.configService.get<any>('stripe.prices');

    return {
      coach: [
        {
          tier: 'COACH_STARTER',
          name: 'Coach Starter',
          price: 19.99,
          currency: 'EUR',
          interval: 'month',
          priceId: prices.coachStarterMonthly,
          athletes: 10,
          sessions: 20,
          videoMinutes: 120,
          coaches: 1,
          archiveMonths: 1,
          features: [
            '10 athletes',
            '20 sessions/month',
            '120 video minutes/month',
            '1 coach',
            '1 month archive',
            'Athlete management',
            'Wave tagging',
            'Scoring',
            'Basic statistics',
          ],
        },
        {
          tier: 'COACH_PRO',
          name: 'Coach Pro',
          price: 39.99,
          currency: 'EUR',
          interval: 'month',
          priceId: prices.coachProMonthly,
          athletes: 40,
          sessions: 80,
          videoMinutes: 600,
          coaches: 3,
          archiveMonths: 1,
          features: [
            '40 athletes',
            '80 sessions/month',
            '600 video minutes/month',
            'Up to 3 coaches',
            '1 month archive',
            'Premium coach profile',
            'Leaderboards',
            'Session summaries',
            'Athlete statistics',
            'Payment tracking',
          ],
        },
        {
          tier: 'ACADEMY',
          name: 'Academy',
          price: 99.99,
          currency: 'EUR',
          interval: 'month',
          priceId: prices.academyMonthly,
          athletes: 150,
          sessions: 300,
          videoMinutes: 2000,
          coaches: 0,
          archiveMonths: 1,
          features: [
            '150 athletes',
            '300 sessions/month',
            '2000 video minutes/month',
            'Unlimited coaches',
            '1 month archive',
            'Academy dashboard',
            'Academy leaderboard',
            'Academy payment tracking',
          ],
        },
      ],
      athlete: [
        {
          tier: 'FREE_ATHLETE',
          name: 'Free',
          price: 0,
          currency: 'EUR',
          interval: 'month',
          priceId: null,
          athletes: 0,
          sessions: 0,
          videoMinutes: 0,
          coaches: 0,
          archiveMonths: 0,
          features: ['View tagged waves', 'Download waves'],
        },
        {
          tier: 'PRO_SURFER',
          name: 'Pro Surfer',
          price: 4.99,
          currency: 'EUR',
          interval: 'month',
          priceId: prices.proSurferMonthly,
          athletes: 0,
          sessions: 0,
          videoMinutes: 0,
          coaches: 0,
          archiveMonths: 0,
          features: [
            'Create free surf sessions',
            'Save waves',
            '300 minutes archived video',
            'Personal statistics',
          ],
        },
      ],
    };
  }

  async importPricesFromCsv(csvFilePath?: string): Promise<{
    products: { created: number; skipped: number };
    prices: { created: number; skipped: number; errors: string[] };
  }> {
    console.log('Importing prices now');
    const filePath = csvFilePath ?? path.resolve(process.cwd(), 'prices.csv');

    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found at path: ${filePath}`);
    }

    const csvContent = fs.readFileSync(filePath, 'utf-8');

    interface PriceCsvRow {
      'Price ID': string;
      'Product ID': string;
      'Product Name': string;
      'Product Statement Descriptor': string;
      'Product Tax Code': string;
      Description: string;
      'Created (UTC)': string;
      Amount: string;
      Currency: string;
      Interval: string;
      'Interval Count': string;
      'Usage Type': string;
      'Aggregate Usage': string;
      'Billing Scheme': string;
      'Trial Period Days': string;
      'Tax Behavior': string;
    }

    const { data } = Papa.parse<PriceCsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const result = {
      products: { created: 0, skipped: 0 },
      prices: { created: 0, skipped: 0, errors: [] as string[] },
    };

    // Collect unique products from CSV
    const productMap = new Map<
      string,
      { name: string; statementDescriptor: string; taxCode: string }
    >();
    for (const row of data) {
      if (row['Product ID'] && !productMap.has(row['Product ID'])) {
        productMap.set(row['Product ID'], {
          name: row['Product Name'],
          statementDescriptor: row['Product Statement Descriptor'],
          taxCode: row['Product Tax Code'],
        });
      }
    }

    // Ensure each product exists in Stripe (create if missing)
    const existingProductIds = new Set<string>();
    for (const [productId, productData] of productMap.entries()) {
      try {
        await this.stripe.products.retrieve(productId);
        existingProductIds.add(productId);
        result.products.skipped++;
        this.logger.log(
          `Product already exists: ${productId} (${productData.name})`,
        );
      } catch {
        // Product not found — create it with the same ID so price references stay valid
        const createParams: Stripe.ProductCreateParams & { id: string } = {
          id: productId,
          name: productData.name,
        };
        if (productData.statementDescriptor) {
          createParams.statement_descriptor = productData.statementDescriptor;
        }
        if (productData.taxCode) {
          createParams.tax_code = productData.taxCode;
        }
        const created = await this.stripe.products.create(
          createParams as Stripe.ProductCreateParams,
        );
        existingProductIds.add(created.id);
        result.products.created++;
        this.logger.log(`Created product: ${productId} (${productData.name})`);
      }
    }

    // Create each price in Stripe
    for (const row of data) {
      const priceId = row['Price ID'];
      try {
        await this.stripe.prices.retrieve(priceId);
        result.prices.skipped++;
        this.logger.log(
          `Price already exists: ${priceId} (${row.Description})`,
        );
        continue;
      } catch {
        // Price not found — proceed to create
      }

      try {
        // Amount in CSV uses European decimal format ("199,90") — convert to cents
        const amountDecimal = parseFloat(row.Amount.replace(',', '.'));
        const amountInCents = Math.round(amountDecimal * 100);

        const priceParams: Stripe.PriceCreateParams = {
          currency: row.Currency.toLowerCase(),
          product: row['Product ID'],
          unit_amount: amountInCents,
          nickname: row.Description || undefined,
          recurring: {
            interval:
              row.Interval as Stripe.PriceCreateParams.Recurring.Interval,
            interval_count: parseInt(row['Interval Count'], 10) || 1,
          },
          tax_behavior:
            (row['Tax Behavior'] as Stripe.PriceCreateParams.TaxBehavior) ||
            undefined,
        };

        await this.stripe.prices.create(priceParams);
        result.prices.created++;
        this.logger.log(
          `Created price: ${row.Description} (${row.Amount} ${row.Currency}/${row.Interval})`,
        );
      } catch (err: any) {
        const msg = `Failed to create price "${priceId}" (${row.Description}): ${err.message}`;
        result.prices.errors.push(msg);
        this.logger.error(msg);
      }
    }

    return result;
  }
}
