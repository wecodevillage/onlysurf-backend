import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionType, SessionStatus } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  create(
    coachId: string,
    data: {
      academyId?: string;
      title: string;
      description?: string;
      type: SessionType;
      location?: string;
      scheduledAt?: Date;
    },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.session.create({
      data: {
        ...data,
        coachId,
      },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findAll(coachId?: string, academyId?: string, status?: SessionStatus) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.session.findMany({
      where: {
        ...(coachId && { coachId }),
        ...(academyId && { academyId }),
        ...(status && { status }),
      },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        roster: {
          include: {
            athlete: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            waves: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        roster: {
          include: {
            athlete: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        waves: {
          include: {
            tags: {
              include: {
                athlete: {
                  select: {
                    id: true,
                    email: true,
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return session;
  }

  update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: SessionStatus;
      location?: string;
      scheduledAt?: Date;
    },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.session.delete({
      where: { id },
    });
  }

  addAthlete(sessionId: string, athleteId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.sessionRoster.create({
      data: {
        sessionId,
        athleteId,
      },
      include: {
        athlete: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async getSummary(id: string) {
    const session = await this.findOne(id);

    const waveStats = await this.prisma.wave.aggregate({
      where: { sessionId: id },
      _count: true,
      _sum: {
        durationSeconds: true,
      },
    });

    const scoreStats = await this.prisma.score.aggregate({
      where: {
        wave: {
          sessionId: id,
        },
      },
      _avg: {
        score: true,
      },
    });

    return {
      session,
      stats: {
        totalWaves: waveStats._count,
        totalDurationMinutes: Math.round(
          (waveStats._sum.durationSeconds || 0) / 60,
        ),
        averageScore: scoreStats._avg.score || 0,
        athleteCount: session.roster.length,
      },
    };
  }
}
