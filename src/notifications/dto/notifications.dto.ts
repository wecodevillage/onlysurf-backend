export type NotificationTemplate =
  | 'WELCOME'
  | 'SESSION_REMINDER'
  | 'WAVE_TAGGED'
  | 'PAYMENT_DUE'
  | 'GENERIC';

export class DesktopSubscriptionKeysDto {
  p256dh: string;
  auth: string;
}

export class SubscribeDesktopDto {
  endpoint: string;
  keys: DesktopSubscriptionKeysDto;
  userAgent?: string;
}

export class UnsubscribeDesktopDto {
  endpoint: string;
}

export class NotificationTargetDto {
  userIds?: string[];
  sessionId?: string;
  academyId?: string;
  allUsers?: boolean;
}

export class SendEmailNotificationDto {
  template?: NotificationTemplate;
  locale?: string;
  subject?: string;
  text?: string;
  html?: string;
  data?: Record<string, string | number | boolean>;
  target: NotificationTargetDto;
}

export class SendDesktopNotificationDto {
  template?: NotificationTemplate;
  title?: string;
  body?: string;
  url?: string;
  data?: Record<string, string | number | boolean>;
  target: NotificationTargetDto;
}
