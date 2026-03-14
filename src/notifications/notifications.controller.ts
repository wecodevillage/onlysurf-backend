import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  SendDesktopNotificationDto,
  SendEmailNotificationDto,
  SubscribeDesktopDto,
  UnsubscribeDesktopDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('firebase-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('desktop/public-key')
  @ApiOperation({
    summary: 'Get desktop notification public key',
    description: 'Returns VAPID public key for browser push subscription setup',
  })
  @ApiResponse({ status: 200, description: 'VAPID public key returned' })
  getDesktopPublicKey() {
    return this.notificationsService.getDesktopPublicKey();
  }

  @Post('desktop/subscribe')
  @ApiOperation({
    summary: 'Subscribe desktop notifications',
    description:
      'Stores a browser push subscription for the authenticated user',
  })
  @ApiBody({ type: SubscribeDesktopDto })
  @ApiResponse({ status: 201, description: 'Subscription saved' })
  subscribeDesktop(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubscribeDesktopDto,
  ) {
    return this.notificationsService.subscribeDesktop(user.id, dto);
  }

  @Delete('desktop/subscribe')
  @ApiOperation({
    summary: 'Unsubscribe desktop notifications',
    description:
      'Removes a browser push subscription for the authenticated user',
  })
  @ApiBody({ type: UnsubscribeDesktopDto })
  @ApiResponse({ status: 200, description: 'Subscription removed' })
  unsubscribeDesktop(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UnsubscribeDesktopDto,
  ) {
    return this.notificationsService.unsubscribeDesktop(user.id, dto.endpoint);
  }

  @Post('email/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send email notifications',
    description:
      'Send email by template or custom content to specific users, session users, academy users, or all users',
  })
  @ApiBody({ type: SendEmailNotificationDto })
  @ApiResponse({ status: 201, description: 'Emails sent' })
  sendEmail(@Body() dto: SendEmailNotificationDto) {
    return this.notificationsService.sendEmailNotification(dto);
  }

  @Post('desktop/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send desktop notifications',
    description:
      'Send desktop push notifications by template or custom content to specific users, session users, academy users, or all users',
  })
  @ApiBody({ type: SendDesktopNotificationDto })
  @ApiResponse({ status: 201, description: 'Desktop notifications sent' })
  sendDesktop(@Body() dto: SendDesktopNotificationDto) {
    return this.notificationsService.sendDesktopNotification(dto);
  }
}
