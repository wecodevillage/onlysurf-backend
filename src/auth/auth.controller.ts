import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  phone?: string;
  dateOfBirth?: Date;
}

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
}
