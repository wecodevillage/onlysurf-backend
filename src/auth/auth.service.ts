import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      location?: string;
      phone?: string;
      dateOfBirth?: Date;
    },
  ) {
    // Check if profile exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this.prisma.profile.update({
        where: { userId },
        data,
      });
    }

    // Create profile if it doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.profile.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async createUserSession(firebaseUid: string, email: string) {
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          email,
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
