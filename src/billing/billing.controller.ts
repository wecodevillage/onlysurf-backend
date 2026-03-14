import { Controller, Get, Post, Body, Headers, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { Request } from 'express';

class CreateCheckoutDto {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

class CreatePortalDto {
  returnUrl: string;
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private stripeService: StripeService) {}

  @Get('plans')
  @Public()
  @ApiOperation({
    summary: 'Get subscription plans',
    description: 'Retrieve all available subscription plans',
  })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  getPlans() {
    const plans = this.stripeService.getPlans();
    return { plans };
  }

  @Post('checkout')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Create checkout session',
    description: 'Create a Stripe checkout session for subscription',
  })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCheckoutDto,
  ) {
    const session = await this.stripeService.createCheckoutSession(
      user.id,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );
    return session;
  }

  @Post('portal')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Create customer portal',
    description: 'Create a Stripe customer portal session',
  })
  @ApiBody({ type: CreatePortalDto })
  @ApiResponse({
    status: 201,
    description: 'Portal session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPortal(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePortalDto,
  ) {
    const session = await this.stripeService.createPortalSession(
      user.id,
      dto.returnUrl,
    );
    return session;
  }

  @Public()
  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook handler',
    description: 'Receive and process webhooks from Stripe',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature for verification',
    required: true,
  })
  @ApiBody({
    schema: { type: 'object', description: 'Stripe webhook payload' },
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || Buffer.from('');

    await this.stripeService.handleWebhook(rawBody, signature);
    return { received: true };
  }

  @Get('prices/import')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Import prices from CSV',
    description:
      'Reads prices.csv from the project root and creates the corresponding products and prices in the configured Stripe account. Idempotent: already-existing products and prices are skipped.',
  })
  @ApiResponse({
    status: 201,
    description: 'Import completed',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'object',
          properties: {
            created: { type: 'number' },
            skipped: { type: 'number' },
          },
        },
        prices: {
          type: 'object',
          properties: {
            created: { type: 'number' },
            skipped: { type: 'number' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async importPrices() {
    return this.stripeService.importPricesFromCsv();
  }
}
