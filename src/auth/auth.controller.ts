import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  UpdateProfileDto,
  CreateSocialNetworkDto,
  UpdateSocialNetworkDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateProfilePhotoDto,
  UpdateProfilePhotoDto,
} from './dto/profile.dto';

class CreateSessionDto {
  firebaseUid: string;
  email: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('session')
  @ApiOperation({
    summary: 'Create user session',
    description: 'Create or retrieve user from Firebase UID',
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: 'User session created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createSession(@Body() dto: CreateSessionDto) {
    const user = await this.authService.createUserSession(
      dto.firebaseUid,
      dto.email,
    );
    return { user };
  }

  @Get('me')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve authenticated user profile',
  })
  @ApiResponse({ status: 200, description: 'User data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    const userData = await this.authService.getMe(user.id);
    return { user: userData };
  }

  @Patch('me/profile')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update or create user profile information',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.authService.updateProfile(user.id, dto);
    return { profile };
  }

  // Social Networks
  @Post('me/social-networks')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Add social network',
    description: 'Add a social network to user profile',
  })
  @ApiBody({ type: CreateSocialNetworkDto })
  @ApiResponse({
    status: 201,
    description: 'Social network added successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSocialNetwork(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSocialNetworkDto,
  ) {
    const socialNetwork = await this.authService.createSocialNetwork(
      user.id,
      dto,
    );
    return { socialNetwork };
  }

  @Get('me/social-networks')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get social networks',
    description: 'Retrieve all social networks for user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Social networks retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSocialNetworks(@CurrentUser() user: CurrentUserPayload) {
    const socialNetworks = await this.authService.getSocialNetworks(user.id);
    return { socialNetworks };
  }

  @Patch('me/social-networks/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Update social network',
    description: 'Update a social network',
  })
  @ApiParam({ name: 'id', description: 'Social network ID' })
  @ApiBody({ type: UpdateSocialNetworkDto })
  @ApiResponse({
    status: 200,
    description: 'Social network updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Social network not found' })
  async updateSocialNetwork(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSocialNetworkDto,
  ) {
    const socialNetwork = await this.authService.updateSocialNetwork(
      user.id,
      id,
      dto,
    );
    return { socialNetwork };
  }

  @Delete('me/social-networks/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Delete social network',
    description: 'Remove a social network from profile',
  })
  @ApiParam({ name: 'id', description: 'Social network ID' })
  @ApiResponse({
    status: 200,
    description: 'Social network deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Social network not found' })
  async deleteSocialNetwork(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.authService.deleteSocialNetwork(user.id, id);
    return { message: 'Social network deleted successfully' };
  }

  // Services
  @Post('me/services')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Add service',
    description: 'Add a service to user profile',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Service added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createService(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateServiceDto,
  ) {
    const service = await this.authService.createService(user.id, dto);
    return { service };
  }

  @Get('me/services')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get services',
    description: 'Retrieve all services for user profile',
  })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getServices(@CurrentUser() user: CurrentUserPayload) {
    const services = await this.authService.getServices(user.id);
    return { services };
  }

  @Patch('me/services/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Update service',
    description: 'Update a service',
  })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateService(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const service = await this.authService.updateService(user.id, id, dto);
    return { service };
  }

  @Delete('me/services/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Delete service',
    description: 'Remove a service from profile',
  })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deleteService(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.authService.deleteService(user.id, id);
    return { message: 'Service deleted successfully' };
  }

  // Profile Photos
  @Post('me/photos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Add profile photo',
    description: 'Add a photo to user profile',
  })
  @ApiBody({ type: CreateProfilePhotoDto })
  @ApiResponse({ status: 201, description: 'Photo added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createProfilePhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProfilePhotoDto,
  ) {
    const photo = await this.authService.createProfilePhoto(user.id, dto);
    return { photo };
  }

  @Get('me/photos')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get profile photos',
    description: 'Retrieve all photos for user profile',
  })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfilePhotos(@CurrentUser() user: CurrentUserPayload) {
    const photos = await this.authService.getProfilePhotos(user.id);
    return { photos };
  }

  @Patch('me/photos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Update profile photo',
    description: 'Update a profile photo',
  })
  @ApiParam({ name: 'id', description: 'Photo ID' })
  @ApiBody({ type: UpdateProfilePhotoDto })
  @ApiResponse({ status: 200, description: 'Photo updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async updateProfilePhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProfilePhotoDto,
  ) {
    const photo = await this.authService.updateProfilePhoto(user.id, id, dto);
    return { photo };
  }

  @Delete('me/photos/:id')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Delete profile photo',
    description: 'Remove a photo from profile',
  })
  @ApiParam({ name: 'id', description: 'Photo ID' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async deleteProfilePhoto(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.authService.deleteProfilePhoto(user.id, id);
    return { message: 'Photo deleted successfully' };
  }
}
