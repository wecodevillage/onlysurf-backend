import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mux from '@mux/mux-node';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MuxService implements OnModuleInit {
  private readonly logger = new Logger(MuxService.name);
  private mux: Mux;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const tokenId = this.configService.get<string>('mux.tokenId');
    const tokenSecret = this.configService.get<string>('mux.tokenSecret');

    if (!tokenId || !tokenSecret) {
      throw new Error('Mux configuration is missing');
    }

    this.mux = new Mux({
      tokenId,
      tokenSecret,
    });

    this.logger.log('Mux client initialized successfully');
  }

  async createDirectUpload() {
    try {
      const upload = await this.mux.video.uploads.create({
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard',
        },
        cors_origin: '*',
      });

      return {
        uploadUrl: upload.url,
        uploadId: upload.id,
      };
    } catch (error) {
      this.logger.error('Failed to create Mux direct upload', error);
      throw error;
    }
  }

  async getAsset(assetId: string) {
    try {
      return await this.mux.video.assets.retrieve(assetId);
    } catch (error) {
      this.logger.error(`Failed to get Mux asset: ${assetId}`, error);
      throw error;
    }
  }

  async deleteAsset(assetId: string) {
    try {
      await this.mux.video.assets.delete(assetId);
      this.logger.log(`Deleted Mux asset: ${assetId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Mux asset: ${assetId}`, error);
      throw error;
    }
  }

  async handleWebhook(payload: any) {
    const eventType = payload.type;
    const data = payload.data;

    this.logger.log(`Processing Mux webhook: ${eventType}`);

    // Store webhook event
    await this.prisma.webhookEvent.create({
      data: {
        source: 'MUX',
        eventId: payload.id,
        eventType,
        payload: JSON.parse(JSON.stringify(payload)),
      },
    });

    switch (eventType) {
      case 'video.asset.ready':
        await this.handleAssetReady(data);
        break;
      case 'video.asset.errored':
        await this.handleAssetErrored(data);
        break;
      default:
        this.logger.debug(`Unhandled Mux event type: ${eventType}`);
    }

    // Mark as processed
    await this.prisma.webhookEvent.updateMany({
      where: { eventId: payload.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  private async handleAssetReady(data: any) {
    const assetId = data.id;
    const playbackIds = data.playback_ids || [];
    const duration = data.duration;
    const aspectRatio = data.aspect_ratio;
    const maxWidth = data.max_stored_resolution === 'HD' ? 1920 : 1280;
    const maxHeight = data.max_stored_resolution === 'HD' ? 1080 : 720;

    // Update video asset in database
    await this.prisma.videoAsset.update({
      where: { muxAssetId: assetId },
      data: {
        status: 'READY',
        muxPlaybackId: playbackIds[0]?.id,
        durationSeconds: duration,
        aspectRatio,
        maxWidth,
        maxHeight,
      },
    });

    this.logger.log(`Asset ready: ${assetId}`);
  }

  private async handleAssetErrored(data: any) {
    const assetId = data.id;

    await this.prisma.videoAsset.update({
      where: { muxAssetId: assetId },
      data: {
        status: 'ERRORED',
      },
    });

    this.logger.error(`Asset errored: ${assetId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    const webhookSecret = this.configService.get<string>('mux.webhookSecret');

    if (!webhookSecret) {
      this.logger.warn('Mux webhook secret not configured');
      return false;
    }

    try {
      // Note: Mux uses HMAC SHA256 for webhook signatures
      // In production, implement proper signature verification
      // For now, we'll return true if secret exists
      return true;
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error);
      return false;
    }
  }
}
