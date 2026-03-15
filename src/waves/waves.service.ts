import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaveMediaType } from '@prisma/client';

@Injectable()
export class WavesService {
  constructor(private prisma: PrismaService) {}

  create(data: {
    sessionId: string;
    academyId?: string;
    videoAssetId?: string;
    photoAssetId?: string;
    mediaType?: WaveMediaType;
    originalFileUrl?: string;
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
        photoAsset: true,
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

  findAll(sessionId?: string, athleteId?: string) {
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
        photoAsset: true,
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
        photoAsset: true,
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

  update(
    id: string,
    data: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      photoAssetId?: string;
      mediaType?: WaveMediaType;
      originalFileUrl?: string;
    },
  ) {
    return this.prisma.wave.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.wave.delete({
      where: { id },
    });
  }

  tagAthlete(waveId: string, athleteId: string) {
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

  addScore(waveId: string, coachId: string, score: number, category?: string) {
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

  updateScore(id: string, score?: number, category?: string) {
    return this.prisma.score.update({
      where: { id },
      data: {
        ...(score !== undefined && { score }),
        ...(category !== undefined && { category }),
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

  deleteScore(id: string) {
    return this.prisma.score.delete({
      where: { id },
    });
  }

  addNote(waveId: string, coachId: string, content: string) {
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

  updateNote(id: string, content: string) {
    return this.prisma.note.update({
      where: { id },
      data: {
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

  deleteNote(id: string) {
    return this.prisma.note.delete({
      where: { id },
    });
  }

  async getDownloadUrl(id: string): Promise<string> {
    const wave = await this.findOne(id);

    const originalFileUrl = wave.originalFileUrl;
    if (typeof originalFileUrl === 'string' && originalFileUrl.length > 0) {
      return originalFileUrl;
    }

    if (wave.mediaType === WaveMediaType.PHOTO) {
      const photoPublicUrl = wave.photoAsset?.publicUrl;
      if (typeof photoPublicUrl === 'string' && photoPublicUrl.length > 0) {
        return photoPublicUrl;
      }

      throw new NotFoundException('Photo not ready for download');
    }

    if (!wave.videoAsset?.muxPlaybackId) {
      throw new NotFoundException('Video not ready for download');
    }

    // Return Mux download URL
    return `https://stream.mux.com/${wave.videoAsset.muxPlaybackId}/high.mp4`;
  }
}
