import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

let counter = 0;
function uid(): string {
  counter++;
  return `test-uid-${Date.now()}-${counter}`;
}

export interface TestUser {
  id: string;
  firebaseUid: string;
  email: string;
  role: UserRole;
}

export async function createTestUser(
  prisma: PrismaService,
  overrides: Partial<{
    email: string;
    role: UserRole;
    firebaseUid: string;
  }> = {},
): Promise<TestUser> {
  const id = uid();
  const user = await prisma.user.create({
    data: {
      firebaseUid: overrides.firebaseUid ?? `fb-${id}`,
      email: overrides.email ?? `${id}@test.onlysurf.com`,
      role: overrides.role ?? UserRole.ATHLETE,
    },
    select: { id: true, firebaseUid: true, email: true, role: true },
  });
  return user;
}

export async function createTestCoach(
  prisma: PrismaService,
  overrides: Partial<{ email: string; firebaseUid: string }> = {},
): Promise<TestUser> {
  return createTestUser(prisma, { ...overrides, role: UserRole.COACH });
}

export async function createTestAthlete(
  prisma: PrismaService,
  overrides: Partial<{ email: string; firebaseUid: string }> = {},
): Promise<TestUser> {
  return createTestUser(prisma, { ...overrides, role: UserRole.ATHLETE });
}

export async function createTestVideoAsset(
  prisma: PrismaService,
  overrides: Partial<{
    muxAssetId: string;
    muxPlaybackId: string;
    durationSeconds: number;
  }> = {},
) {
  const id = uid();
  return prisma.videoAsset.create({
    data: {
      muxAssetId: overrides.muxAssetId ?? `mux-asset-${id}`,
      muxPlaybackId: overrides.muxPlaybackId ?? `mux-playback-${id}`,
      status: 'READY',
      durationSeconds: overrides.durationSeconds ?? 30,
    },
  });
}
