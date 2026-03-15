import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Get,
  Patch,
  Delete,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MuxService } from './mux.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import type { Request } from 'express';
import type { PhotoAsset, VideoAsset } from '@prisma/client';

class CreateVideoAssetDto {
  muxAssetId: string;
  muxPlaybackId?: string;
  status?: 'PREPARING' | 'READY' | 'ERRORED';
  durationSeconds?: number;
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
}

class UpdateVideoAssetDto {
  muxPlaybackId?: string;
  status?: 'PREPARING' | 'READY' | 'ERRORED';
  durationSeconds?: number;
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
}

class CreatePhotoAssetDto {
  gcsBucket: string;
  gcsObjectPath: string;
  publicUrl: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
}

class UpdatePhotoAssetDto {
  publicUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
}

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private muxService: MuxService,
    private prisma: PrismaService,
  ) {}

  @Post('mux/uploads')
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
  @Post('mux/webhook')
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

  @Post('assets/videos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Create video asset record' })
  @ApiBody({ type: CreateVideoAssetDto })
  @ApiResponse({ status: 201, description: 'Video asset created' })
  createVideoAsset(@Body() dto: CreateVideoAssetDto): Promise<VideoAsset> {
    return this.prisma.videoAsset.create({ data: dto });
  }

  @Get('assets/videos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'List video assets' })
  @ApiResponse({ status: 200, description: 'Video assets list' })
  findAllVideoAssets(): Promise<VideoAsset[]> {
    return this.prisma.videoAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('assets/videos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Get video asset by id' })
  @ApiParam({ name: 'id', description: 'Video asset id' })
  @ApiResponse({ status: 200, description: 'Video asset found' })
  async findVideoAssetById(@Param('id') id: string): Promise<VideoAsset> {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Video asset not found');
    }
    return asset;
  }

  @Patch('assets/videos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Update video asset' })
  @ApiParam({ name: 'id', description: 'Video asset id' })
  @ApiBody({ type: UpdateVideoAssetDto })
  @ApiResponse({ status: 200, description: 'Video asset updated' })
  updateVideoAsset(
    @Param('id') id: string,
    @Body() dto: UpdateVideoAssetDto,
  ): Promise<VideoAsset> {
    return this.prisma.videoAsset.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('assets/videos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Delete video asset' })
  @ApiParam({ name: 'id', description: 'Video asset id' })
  @ApiResponse({ status: 200, description: 'Video asset deleted' })
  async deleteVideoAsset(@Param('id') id: string) {
    await this.prisma.videoAsset.delete({ where: { id } });
    return { message: 'Video asset deleted successfully' };
  }

  @Post('assets/photos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Create photo asset record' })
  @ApiBody({ type: CreatePhotoAssetDto })
  @ApiResponse({ status: 201, description: 'Photo asset created' })
  createPhotoAsset(@Body() dto: CreatePhotoAssetDto): Promise<PhotoAsset> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.photoAsset.create({ data: dto });
  }

  @Get('assets/photos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'List photo assets' })
  @ApiResponse({ status: 200, description: 'Photo assets list' })
  findAllPhotoAssets(): Promise<PhotoAsset[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.photoAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('assets/photos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Get photo asset by id' })
  @ApiParam({ name: 'id', description: 'Photo asset id' })
  @ApiResponse({ status: 200, description: 'Photo asset found' })
  async findPhotoAssetById(@Param('id') id: string): Promise<PhotoAsset> {
    const asset = await this.prisma.photoAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Photo asset not found');
    }
    return asset;
  }

  @Patch('assets/photos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Update photo asset' })
  @ApiParam({ name: 'id', description: 'Photo asset id' })
  @ApiBody({ type: UpdatePhotoAssetDto })
  @ApiResponse({ status: 200, description: 'Photo asset updated' })
  updatePhotoAsset(
    @Param('id') id: string,
    @Body() dto: UpdatePhotoAssetDto,
  ): Promise<PhotoAsset> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.photoAsset.update({
      where: { id },
      data: dto,
    });
  }

  @Delete('assets/photos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Delete photo asset' })
  @ApiParam({ name: 'id', description: 'Photo asset id' })
  @ApiResponse({ status: 200, description: 'Photo asset deleted' })
  async deletePhotoAsset(@Param('id') id: string) {
    await this.prisma.photoAsset.delete({ where: { id } });
    return { message: 'Photo asset deleted successfully' };
  }
}
