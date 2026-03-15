import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../src/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator';

/**
 * Test guard that replaces FirebaseAuthGuard in e2e tests.
 * Reads user identity from `x-test-user-id` header instead of Firebase token.
 */
@Injectable()
export class TestAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-test-user-id'] as string | undefined;

    if (!userId) {
      throw new UnauthorizedException(
        'Missing x-test-user-id header in test request',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firebaseUid: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException(`Test user not found: ${userId}`);
    }

    request.user = user;
    return true;
  }
}
