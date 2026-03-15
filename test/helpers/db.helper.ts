import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Deletes all database records in FK-safe order.
 * Only runs when NODE_ENV !== 'production'.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clean database in production');
  }

  // Delete child tables first to respect foreign key constraints
  await prisma.score.deleteMany();
  await prisma.note.deleteMany();
  await prisma.waveTag.deleteMany();
  await prisma.savedWave.deleteMany();
  await prisma.wave.deleteMany();
  await prisma.videoAsset.deleteMany();
  await prisma.sessionRoster.deleteMany();
  await prisma.session.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notificationSubscription.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.academyMembership.deleteMany();
  await prisma.socialNetwork.deleteMany();
  await prisma.service.deleteMany();
  await prisma.profilePhoto.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.academy.deleteMany();
  await prisma.user.deleteMany();
}
