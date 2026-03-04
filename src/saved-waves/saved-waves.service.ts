import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedWavesService {
  constructor(private prisma: PrismaService) {}

  async saveWave(athleteId: string, waveId: string) {
    // Get wave details to preserve references
    const wave = await this.prisma.wave.findUnique({
      where: { id: waveId },
      include: {
        session: {
          select: {
            id: true,
            coachId: true,
          },
        },
      },
    });

    if (!wave) {
      throw new NotFoundException('Wave not found');
    }

    // Check if already saved
    const existing = await this.prisma.savedWave.findUnique({
      where: {
        waveId_athleteId: {
          waveId,
          athleteId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Wave already saved');
    }

    // Create saved wave
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.savedWave.create({
      data: {
        waveId,
        athleteId,
        sessionId: wave.sessionId,
        academyId: wave.academyId,
        coachId: wave.session.coachId,
        durationSnapshot: wave.durationSeconds || 0,
      },
      include: {
        wave: {
          include: {
            videoAsset: true,
            tags: true,
          },
        },
      },
    });
  }

  findAll(athleteId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.prisma.savedWave.findMany({
      where: { athleteId },
      include: {
        wave: {
          include: {
            videoAsset: true,
            session: {
              select: {
                id: true,
                title: true,
              },
            },
            academy: {
              select: {
                id: true,
                name: true,
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
        },
      },
      orderBy: {
        savedAt: 'desc',
      },
    });
  }

  async delete(id: string, athleteId: string) {
    const savedWave = await this.prisma.savedWave.findUnique({
      where: { id },
      include: {
        wave: {
          include: {
            videoAsset: true,
          },
        },
      },
    });

    if (!savedWave) {
      throw new NotFoundException('Saved wave not found');
    }

    if (savedWave.athleteId !== athleteId) {
      throw new BadRequestException(
        "Cannot delete another athlete's saved wave",
      );
    }

    // Delete the saved wave
    await this.prisma.savedWave.delete({
      where: { id },
    });

    // Check if any other saved waves reference this video asset
    const otherReferences = await this.prisma.savedWave.count({
      where: {
        wave: {
          videoAssetId: savedWave.wave.videoAssetId,
        },
      },
    });

    // If no other references and the session is archived, delete the Mux asset
    // This would be handled by the archiving service in production
    // For now, we just return the status
    return {
      deleted: true,
      shouldDeleteAsset: otherReferences === 0,
      assetId: savedWave.wave.videoAsset.muxAssetId,
    };
  }

  async getTotalDuration(athleteId: string): Promise<number> {
    const result = await this.prisma.savedWave.aggregate({
      where: { athleteId },
      _sum: {
        durationSnapshot: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result._sum.durationSnapshot || 0;
  }
}
