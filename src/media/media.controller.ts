import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MuxService } from './mux.service';
import { Public } from '../common/decorators/public.decorator';
import type { Request } from 'express';

@ApiTags('Media')
@Controller('media/mux')
export class MediaController {
  constructor(private muxService: MuxService) {}

  @Post('uploads')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Create Mux upload',
    description: 'Generate a direct upload URL for video to Mux',
  })
  @ApiResponse({
    status: 201,
    description: 'Upload URL created successfully',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: {
          type: 'string',
          example: 'https://storage.googleapis.com/...',
        },
        assetId: { type: 'string', example: 'abc123' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUpload() {
    const upload = await this.muxService.createDirectUpload();
    return upload;
  }

  @Public()
  @Post('webhook')
  @ApiOperation({
    summary: 'Mux webhook handler',
    description: 'Receive and process webhooks from Mux',
  })
  @ApiHeader({
    name: 'mux-signature',
    description: 'Mux webhook signature for verification',
    required: true,
  })
  @ApiBody({ schema: { type: 'object', description: 'Mux webhook payload' } })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('mux-signature') signature: string,
    @Body() payload: any,
  ) {
    // Verify webhook signature
    const rawBody = req.rawBody?.toString('utf-8') || '';
    const isValid = this.muxService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return { error: 'Invalid signature' };
    }

    await this.muxService.handleWebhook(payload);
    return { received: true };
  }
}
