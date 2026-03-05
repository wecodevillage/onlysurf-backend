import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateSocialNetworkDto,
  UpdateSocialNetworkDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateProfilePhotoDto,
  UpdateProfilePhotoDto,
} from './dto/profile.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            socialNetworks: true,
            services: {
              where: { isActive: true },
            },
            photos: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
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

  // Social Networks
  async createSocialNetwork(userId: string, dto: CreateSocialNetworkDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.socialNetwork.create({
      data: {
        profileId: profile.id,
        type: dto.type,
        value: dto.value,
        privacy: dto.privacy || 'PUBLIC',
      },
    });
  }

  async getSocialNetworks(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.socialNetwork.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateSocialNetwork(
    userId: string,
    socialNetworkId: string,
    dto: UpdateSocialNetworkDto,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.socialNetwork.update({
      where: {
        id: socialNetworkId,
        profileId: profile.id,
      },
      data: dto,
    });
  }

  async deleteSocialNetwork(userId: string, socialNetworkId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    await this.prisma.socialNetwork.delete({
      where: {
        id: socialNetworkId,
        profileId: profile.id,
      },
    });
  }

  // Services
  async createService(userId: string, dto: CreateServiceDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.service.create({
      data: {
        profileId: profile.id,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'EUR',
      },
    });
  }

  async getServices(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.service.findMany({
      where: { profileId: profile.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateService(
    userId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.service.update({
      where: {
        id: serviceId,
        profileId: profile.id,
      },
      data: dto,
    });
  }

  async deleteService(userId: string, serviceId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    await this.prisma.service.delete({
      where: {
        id: serviceId,
        profileId: profile.id,
      },
    });
  }

  // Profile Photos
  async createProfilePhoto(userId: string, dto: CreateProfilePhotoDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        url: dto.url,
        description: dto.description,
        order: dto.order || 0,
      },
    });
  }

  async getProfilePhotos(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.profilePhoto.findMany({
      where: { profileId: profile.id },
      orderBy: { order: 'asc' },
    });
  }

  async updateProfilePhoto(
    userId: string,
    photoId: string,
    dto: UpdateProfilePhotoDto,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.profilePhoto.update({
      where: {
        id: photoId,
        profileId: profile.id,
      },
      data: dto,
    });
  }

  async deleteProfilePhoto(userId: string, photoId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    await this.prisma.profilePhoto.delete({
      where: {
        id: photoId,
        profileId: profile.id,
      },
    });
  }
}
