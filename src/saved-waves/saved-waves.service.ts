import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from '../media/mux.service';

@Injectable()
export class SavedWavesService {
  private readonly logger = new Logger(SavedWavesService.name);

  constructor(
    private prisma: PrismaService,
    private muxService: MuxService,
  ) {}

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
            session: {
              select: {
                id: true,
                status: true,
                archivedAt: true,
              },
            },
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

    const isSessionArchived =
      savedWave.wave.session.status === 'ARCHIVED' ||
      savedWave.wave.session.archivedAt !== null;
    const muxAssetId = savedWave.wave.videoAsset.muxAssetId;
    const shouldDeleteAsset =
      otherReferences === 0 && muxAssetId && isSessionArchived;

    // Only delete Mux asset if no references AND session is archived
    // Active sessions will be handled by the archiving process
    if (shouldDeleteAsset) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.muxService.deleteAsset(muxAssetId);
        this.logger.log(
          `Deleted Mux asset ${muxAssetId} - no remaining references and session archived`,
        );
      } catch (error) {
        this.logger.error(`Failed to delete Mux asset ${muxAssetId}: ${error}`);
        // Continue even if Mux deletion fails
      }
    } else if (!muxAssetId) {
      this.logger.debug(`Skipping Mux asset deletion - no Mux asset ID`);
    } else if (!isSessionArchived) {
      this.logger.debug(
        `Skipping Mux asset deletion for ${muxAssetId} - session still active`,
      );
    }

    return {
      deleted: true,
      assetDeleted: shouldDeleteAsset,
      assetId: muxAssetId,
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
