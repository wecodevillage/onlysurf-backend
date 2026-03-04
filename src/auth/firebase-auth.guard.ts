import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private firebaseService: FirebaseService,
    private prismaService: PrismaService,
    private reflector: Reflector,
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
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);

      // Find or create user
      let user = await this.prismaService.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        // Auto-create user on first login
        user = await this.prismaService.user.create({
          data: {
            firebaseUid: decodedToken.uid,
            email:
              decodedToken.email || `${decodedToken.uid}@temp.onlysurf.com`,
          },
          select: {
            id: true,
            firebaseUid: true,
            email: true,
            role: true,
          },
        });
        this.logger.log(`Auto-created user: ${user.id}`);
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? (token as string) : undefined;
  }
}
