import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class AcademiesService {
  constructor(private prisma: PrismaService) {}

  async create(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      logoUrl?: string;
      location?: string;
      website?: string;
    },
  ) {
    // Create academy and add owner as member
    const academy = await this.prisma.academy.create({
      data: {
        ...data,
        ownerId,
        memberships: {
          create: {
            userId: ownerId,
            role: MemberRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return academy;
  }

  async findOne(id: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return academy;
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      location?: string;
      website?: string;
    },
  ) {
    // Check if user is owner
    const academy = await this.prisma.academy.findUnique({
      where: { id },
    });

    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    if (academy.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update the academy');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.academy.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async getMembers(id: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { id },
    });

    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.academyMembership.findMany({
      where: { academyId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
    });
  }

  async addMember(
    academyId: string,
    userId: string,
    memberId: string,
    role: MemberRole = MemberRole.ATHLETE,
  ) {
    // Check if user has permission (owner or coach)
    const membership = await this.prisma.academyMembership.findUnique({
      where: {
        academyId_userId: {
          academyId,
          userId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== MemberRole.OWNER &&
        membership.role !== MemberRole.COACH)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Add member
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.academyMembership.create({
      data: {
        academyId,
        userId: memberId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
    });
  }

  async checkMembership(academyId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.academyMembership.findUnique({
      where: {
        academyId_userId: {
          academyId,
          userId,
        },
      },
    });

    return !!membership;
  }
}
