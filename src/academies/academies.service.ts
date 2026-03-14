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

  async getStats(academyId: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { id: academyId },
      select: { id: true },
    });

    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      sessionsThisMonth,
      sessionsThisYear,
      sessionsAllTime,
      athleteCount,
      coachMembershipCount,
      ownerCount,
      waveCount,
      mediaStats,
    ] = await Promise.all([
      this.prisma.session.count({
        where: {
          academyId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      this.prisma.session.count({
        where: {
          academyId,
          createdAt: {
            gte: startOfYear,
          },
        },
      }),
      this.prisma.session.count({
        where: { academyId },
      }),
      this.prisma.academyMembership.count({
        where: {
          academyId,
          role: MemberRole.ATHLETE,
        },
      }),
      this.prisma.academyMembership.count({
        where: {
          academyId,
          role: MemberRole.COACH,
        },
      }),
      this.prisma.academyMembership.count({
        where: {
          academyId,
          role: MemberRole.OWNER,
        },
      }),
      this.prisma.wave.count({
        where: { academyId },
      }),
      this.prisma.videoAsset.aggregate({
        where: {
          waves: {
            some: {
              academyId,
            },
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          durationSeconds: true,
        },
      }),
    ]);

    const totalCoaches = coachMembershipCount + ownerCount;
    const totalMediaSeconds = mediaStats._sum.durationSeconds || 0;

    return {
      sessions: {
        thisMonth: sessionsThisMonth,
        thisYear: sessionsThisYear,
        allTime: sessionsAllTime,
      },
      members: {
        athletes: athleteCount,
        coaches: totalCoaches,
      },
      waves: {
        total: waveCount,
      },
      media: {
        assets: mediaStats._count.id,
        totalDurationSeconds: totalMediaSeconds,
        totalDurationMinutes: Math.round(totalMediaSeconds / 60),
      },
    };
  }

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
