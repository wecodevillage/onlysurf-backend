/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';
import webpush from 'web-push';
import * as Handlebars from 'handlebars';
import type {
  NotificationTemplate,
  SendDesktopNotificationDto,
  SendEmailNotificationDto,
  SubscribeDesktopDto,
} from './dto/notifications.dto';

type DesktopTemplatePayload = {
  title?: string;
  body?: string;
  url?: string;
};

type EmailTemplateMeta = {
  fileName: string;
  defaultPath: string;
  subjects: {
    en: string;
    pt: string;
  };
};

const EMAIL_TEMPLATES: Record<NotificationTemplate, EmailTemplateMeta> = {
  WELCOME: {
    fileName: 'welcome',
    defaultPath: '/dashboard',
    subjects: {
      en: 'Welcome to OnlySurf',
      pt: 'Bem-vindo ao OnlySurf',
    },
  },
  SESSION_REMINDER: {
    fileName: 'session-reminder',
    defaultPath: '/sessions',
    subjects: {
      en: 'Session Reminder',
      pt: 'Lembrete de sessao',
    },
  },
  WAVE_TAGGED: {
    fileName: 'wave-tagged',
    defaultPath: '/waves',
    subjects: {
      en: 'New Tagged Wave',
      pt: 'Nova onda marcada',
    },
  },
  PAYMENT_DUE: {
    fileName: 'payment-due',
    defaultPath: '/billing',
    subjects: {
      en: 'Payment Due Reminder',
      pt: 'Lembrete de pagamento',
    },
  },
  GENERIC: {
    fileName: 'generic',
    defaultPath: '/dashboard',
    subjects: {
      en: 'OnlySurf Notification',
      pt: 'Notificacao OnlySurf',
    },
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly appUrl: string;
  private readonly vapidPublicKey?: string;
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const resendApiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail =
      this.configService.get<string>('resend.fromEmail') ||
      'noreply@onlysurf.com';
    this.appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    if (!resendApiKey) {
      throw new Error('Resend API key is missing');
    }

    this.resend = new Resend(resendApiKey);
    this.registerPartials();

    const vapidPublicKey = this.configService.get<string>(
      'NOTIFICATIONS_VAPID_PUBLIC_KEY',
    );
    const vapidPrivateKey = this.configService.get<string>(
      'NOTIFICATIONS_VAPID_PRIVATE_KEY',
    );
    const vapidSubject =
      this.configService.get<string>('NOTIFICATIONS_VAPID_SUBJECT') ||
      'mailto:noreply@onlysurf.com';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.vapidPublicKey = vapidPublicKey;
    } else {
      this.logger.warn(
        'VAPID keys are not configured. Desktop notification delivery is disabled.',
      );
    }
  }

  getDesktopPublicKey() {
    if (!this.vapidPublicKey) {
      throw new BadRequestException(
        'Desktop notifications are not configured on the server',
      );
    }

    return { publicKey: this.vapidPublicKey };
  }

  async subscribeDesktop(userId: string, dto: SubscribeDesktopDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.prisma.notificationSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    });
  }

  async unsubscribeDesktop(userId: string, endpoint: string) {
    await this.prisma.notificationSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

    return { success: true };
  }

  async sendEmailNotification(dto: SendEmailNotificationDto) {
    const userIds = await this.resolveTargetUserIds(dto.target);

    if (!userIds.length) {
      throw new NotFoundException('No users found for this target');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            locale: true,
          },
        },
      },
    });

    const recipients = users.map((u) => u.email).filter(Boolean);

    if (!recipients.length) {
      throw new NotFoundException('No email recipients found for this target');
    }

    if (dto.html || dto.text) {
      if (!dto.subject) {
        throw new BadRequestException(
          'Custom email content requires a subject',
        );
      }

      const customPayload: {
        from: string;
        to: string[];
        subject: string;
        html?: string;
        text?: string;
      } = {
        from: this.fromEmail,
        to: recipients,
        subject: dto.subject,
      };

      if (dto.html) {
        customPayload.html = dto.html;
      }
      if (dto.text) {
        customPayload.text = dto.text;
      }

      const { error } = await this.resend.emails.send(customPayload as any);
      if (error) {
        throw new BadRequestException(error.message);
      }

      return {
        sent: recipients.length,
        recipients,
      };
    }

    const template = dto.template;
    if (!template) {
      throw new BadRequestException(
        'Provide a template or custom html/text content for emails',
      );
    }

    const localeGroups = users.reduce<Record<string, string[]>>((acc, user) => {
      const preferredLocale = dto.locale || user.profile?.locale || 'en';
      const locale = this.normalizeLocale(preferredLocale);
      if (!acc[locale]) {
        acc[locale] = [];
      }
      acc[locale].push(user.email);
      return acc;
    }, {});

    let sent = 0;
    for (const [locale, localeRecipients] of Object.entries(localeGroups)) {
      const rendered = this.renderEmailTemplate(
        template,
        locale,
        dto.data || {},
      );

      const payload: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text: string;
      } = {
        from: this.fromEmail,
        to: localeRecipients,
        subject: dto.subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
      };

      const { error } = await this.resend.emails.send(payload as any);
      if (error) {
        throw new BadRequestException(error.message);
      }

      sent += localeRecipients.length;
    }

    return {
      sent,
      recipients,
    };
  }

  async sendDesktopNotification(dto: SendDesktopNotificationDto) {
    if (!this.vapidPublicKey) {
      throw new BadRequestException(
        'Desktop notifications are not configured on the server',
      );
    }

    const userIds = await this.resolveTargetUserIds(dto.target);

    if (!userIds.length) {
      throw new NotFoundException('No users found for this target');
    }

    const subscriptions = await this.prisma.notificationSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    if (!subscriptions.length) {
      throw new NotFoundException(
        'No desktop subscriptions found for this target',
      );
    }

    const template = this.buildDesktopTemplatePayload(dto.template, dto.data);
    const title = dto.title || template.title;
    const body = dto.body || template.body;

    if (!title || !body) {
      throw new BadRequestException(
        'Desktop notification requires template or custom title + body',
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      url: dto.url || template.url,
      data: dto.data || {},
      timestamp: new Date().toISOString(),
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        ),
      ),
    );

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        sent++;
        continue;
      }

      failed++;
      const statusCode = result.reason?.statusCode as number | undefined;
      if (statusCode === 404 || statusCode === 410) {
        const stale = subscriptions[i];
        if (stale) {
          await this.prisma.notificationSubscription.deleteMany({
            where: { endpoint: stale.endpoint },
          });
        }
      }
    }

    return {
      sent,
      failed,
      total: subscriptions.length,
    };
  }

  private async resolveTargetUserIds(target: {
    userIds?: string[];
    sessionId?: string;
    academyId?: string;
    allUsers?: boolean;
  }) {
    if (target.allUsers) {
      const users = await this.prisma.user.findMany({
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    if (target.userIds?.length) {
      return [...new Set(target.userIds)];
    }

    if (target.sessionId) {
      const session = await this.prisma.session.findUnique({
        where: { id: target.sessionId },
        select: {
          coachId: true,
          roster: {
            select: {
              athleteId: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      return [
        session.coachId,
        ...session.roster.map((r) => r.athleteId),
      ].filter((value, index, self) => self.indexOf(value) === index);
    }

    if (target.academyId) {
      const academy = await this.prisma.academy.findUnique({
        where: { id: target.academyId },
        select: {
          ownerId: true,
          memberships: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!academy) {
        throw new NotFoundException('Academy not found');
      }

      return [
        academy.ownerId,
        ...academy.memberships.map((m) => m.userId),
      ].filter((value, index, self) => self.indexOf(value) === index);
    }

    throw new BadRequestException(
      'Target is required: provide userIds, sessionId, academyId, or allUsers=true',
    );
  }

  private buildDesktopTemplatePayload(
    template?: NotificationTemplate,
    data: Record<string, string | number | boolean> = {},
  ): DesktopTemplatePayload {
    if (!template) {
      return {};
    }

    switch (template) {
      case 'WELCOME':
        return {
          title: 'Welcome to OnlySurf',
          body: 'Your account is ready.',
          url: '/dashboard',
        };
      case 'SESSION_REMINDER':
        return {
          title: 'Session Reminder',
          body: `${data['sessionTitle'] || 'You have a session soon'}`,
          url: '/sessions',
        };
      case 'WAVE_TAGGED':
        return {
          title: 'New Tagged Wave',
          body: 'A new wave was tagged for you.',
          url: '/waves',
        };
      case 'PAYMENT_DUE':
        return {
          title: 'Payment Due',
          body: 'You have a pending payment to review.',
          url: '/billing',
        };
      case 'GENERIC':
      default:
        return {
          title: 'OnlySurf Notification',
          body: String(data['message'] || 'You have a new notification.'),
          url: '/dashboard',
        };
    }
  }

  private normalizeLocale(locale?: string): 'en' | 'pt' {
    if (!locale) {
      return 'en';
    }
    const normalized = locale.toLowerCase();
    if (normalized.startsWith('pt')) {
      return 'pt';
    }
    return 'en';
  }

  private renderEmailTemplate(
    template: NotificationTemplate,
    locale: string,
    data: Record<string, string | number | boolean>,
  ) {
    const normalizedLocale = this.normalizeLocale(locale);
    const templateMeta = EMAIL_TEMPLATES[template];
    const compiled = this.getCompiledTemplate(
      normalizedLocale,
      templateMeta.fileName,
    );

    const html = compiled({
      ...data,
      name: data['name'] || 'surfer',
      sessionTitle: data['sessionTitle'] || 'You have a session soon',
      message: data['message'] || 'You have a new notification in OnlySurf.',
      appUrl: this.appUrl,
      url: data['url'] || templateMeta.defaultPath,
    });

    return {
      subject: templateMeta.subjects[normalizedLocale],
      html,
      text: this.htmlToText(html),
    };
  }

  private registerPartials() {
    const templatesRoot = this.getTemplatesRootPath();
    const partialsPath = path.join(templatesRoot, 'partials');

    if (!fs.existsSync(partialsPath)) {
      this.logger.warn(`Notification partials path not found: ${partialsPath}`);
      return;
    }

    const header = fs.readFileSync(
      path.join(partialsPath, 'header.hbs'),
      'utf8',
    );
    const footer = fs.readFileSync(
      path.join(partialsPath, 'footer.hbs'),
      'utf8',
    );

    Handlebars.registerPartial('header', header);
    Handlebars.registerPartial('footer', footer);
  }

  private getCompiledTemplate(locale: 'en' | 'pt', templateFileName: string) {
    const cacheKey = `${locale}:${templateFileName}`;
    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const templatesRoot = this.getTemplatesRootPath();
    const localizedPath = path.join(
      templatesRoot,
      'emails',
      locale,
      `${templateFileName}.hbs`,
    );
    const fallbackPath = path.join(
      templatesRoot,
      'emails',
      'en',
      `${templateFileName}.hbs`,
    );

    const targetPath = fs.existsSync(localizedPath)
      ? localizedPath
      : fallbackPath;

    if (!fs.existsSync(targetPath)) {
      throw new BadRequestException(
        `Email template not found: ${templateFileName} (${locale})`,
      );
    }

    const source = fs.readFileSync(targetPath, 'utf8');
    const compiled = Handlebars.compile(source);
    this.templateCache.set(cacheKey, compiled);
    return compiled;
  }

  private getTemplatesRootPath() {
    return path.join(__dirname, 'templates');
  }

  private htmlToText(html: string) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
