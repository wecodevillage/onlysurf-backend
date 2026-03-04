import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WavesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    sessionId: string;
    academyId?: string;
    videoAssetId: string;
    title?: string;
    description?: string;
    startTime?: number;
    endTime?: number;
    durationSeconds?: number;
    thumbnailUrl?: string;
  }) {
    return this.prisma.wave.create({
      data,
      include: {
        session: {
          select: {
            id: true,
            title: true,
          },
        },
        videoAsset: true,
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
    });
  }

  async findAll(sessionId?: string, athleteId?: string) {
    return this.prisma.wave.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(athleteId && {
          tags: {
            some: {
              athleteId,
            },
          },
        }),
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
          },
        },
        videoAsset: true,
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
        scores: {
          include: {
            coach: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        notes: {
          include: {
            coach: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const wave = await this.prisma.wave.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            coach: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        videoAsset: true,
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
        scores: {
          include: {
            coach: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        notes: {
          include: {
            coach: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    return wave;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
    },
  ) {
    return this.prisma.wave.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.wave.delete({
      where: { id },
    });
  }

  async tagAthlete(waveId: string, athleteId: string) {
    return this.prisma.waveTag.create({
      data: {
        waveId,
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

  async addScore(
    waveId: string,
    coachId: string,
    score: number,
    category?: string,
  ) {
    return this.prisma.score.create({
      data: {
        waveId,
        coachId,
        score,
        category,
      },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async addNote(waveId: string, coachId: string, content: string) {
    return this.prisma.note.create({
      data: {
        waveId,
        coachId,
        content,
      },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async getDownloadUrl(id: string): Promise<string> {
    const wave = await this.findOne(id);

    if (!wave.videoAsset.muxPlaybackId) {
      throw new NotFoundException('Video not ready for download');
    }

    // Return Mux download URL
    return `https://stream.mux.com/${wave.videoAsset.muxPlaybackId}/high.mp4`;
  }
}
