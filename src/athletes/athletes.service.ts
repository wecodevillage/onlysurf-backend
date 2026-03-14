import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AthletesService {
  constructor(private prisma: PrismaService) {}

  findAll(academyId?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'ATHLETE',
        ...(academyId && {
          academyMemberships: {
            some: {
              academyId,
            },
          },
        }),
      },
      include: {
        profile: true,
        academyMemberships: {
          include: {
            academy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        academyMemberships: {
          include: {
            academy: true,
          },
        },
      },
    });
  }

  async getStats(athleteId: string) {
    const [totalWaves, totalSessions, savedWaves] = await Promise.all([
      this.prisma.waveTag.count({
        where: { athleteId },
      }),
      this.prisma.sessionRoster.count({
        where: { athleteId },
      }),
      this.prisma.savedWave.count({
        where: { athleteId },
      }),
    ]);

    const totalDuration = await this.prisma.savedWave.aggregate({
      where: { athleteId },
      _sum: {
        durationSnapshot: true,
      },
    });

    return {
      totalWaves,
      totalSessions,
      savedWaves,
      totalDurationMinutes: Math.round(
        (totalDuration._sum.durationSnapshot || 0) / 60,
      ),
    };
  }
}
