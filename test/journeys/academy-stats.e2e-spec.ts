import '../setup-e2e';
import {
  TestContext,
  createTestApp,
  destroyTestApp,
  authHeaders,
} from '../helpers/test-app';
import {
  createTestCoach,
  createTestAthlete,
  createTestVideoAsset,
  TestUser,
} from '../helpers/seed.helper';
import { cleanDatabase } from '../helpers/db.helper';

describe('Academy Stats Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;
  let athlete1: TestUser;
  let athlete2: TestUser;
  let academyId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);

    coach = await createTestCoach(ctx.prisma);
    athlete1 = await createTestAthlete(ctx.prisma);
    athlete2 = await createTestAthlete(ctx.prisma);

    // Create academy and add members
    const academyRes = await ctx.request
      .post('/v1/academies')
      .set(authHeaders(coach.id))
      .send({ name: 'Stats Test Academy' });
    academyId = academyRes.body.academy.id;

    await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete1.id, role: 'ATHLETE' });

    await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete2.id, role: 'ATHLETE' });

    // Create 2 sessions with waves
    const session1Res = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ academyId, title: 'Session 1', type: 'TRAINING' });
    const sessionId1 = session1Res.body.session.id;

    const session2Res = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ academyId, title: 'Session 2', type: 'TRAINING' });
    const sessionId2 = session2Res.body.session.id;

    // Create video assets and waves
    const asset1 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 60,
    });
    const asset2 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 45,
    });
    const asset3 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 30,
    });

    await ctx.request.post('/v1/waves').set(authHeaders(coach.id)).send({
      sessionId: sessionId1,
      academyId,
      videoAssetId: asset1.id,
      title: 'Wave 1',
      durationSeconds: 60,
    });

    await ctx.request.post('/v1/waves').set(authHeaders(coach.id)).send({
      sessionId: sessionId1,
      academyId,
      videoAssetId: asset2.id,
      title: 'Wave 2',
      durationSeconds: 45,
    });

    await ctx.request.post('/v1/waves').set(authHeaders(coach.id)).send({
      sessionId: sessionId2,
      academyId,
      videoAssetId: asset3.id,
      title: 'Wave 3',
      durationSeconds: 30,
    });
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Academy Stats ────────────────────────────────────────────────

  it('GET /v1/academies/:id/stats → returns accurate statistics', async () => {
    const res = await ctx.request
      .get(`/v1/academies/${academyId}/stats`)
      .set(authHeaders(coach.id))
      .expect(200);

    const stats = res.body.stats;
    expect(stats).toBeDefined();

    // Sessions
    expect(stats.sessions).toBeDefined();
    expect(stats.sessions.allTime).toBe(2);
    expect(stats.sessions.thisMonth).toBe(2);

    // Members — coach (OWNER) + 2 athletes
    expect(stats.members).toBeDefined();
    expect(stats.members.athletes).toBe(2);
    expect(stats.members.coaches).toBeGreaterThanOrEqual(1);

    // Waves
    expect(stats.waves).toBeDefined();
    expect(stats.waves.total).toBe(3);

    // Media
    expect(stats.media).toBeDefined();
    expect(stats.media.totalAssets).toBeGreaterThanOrEqual(3);
  });

  // ── Stats update after adding data ───────────────────────────────

  it('stats update after creating new session + wave', async () => {
    const sessionRes = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ academyId, title: 'Session 3', type: 'TRAINING' });
    const newSessionId = sessionRes.body.session.id;

    const newAsset = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 20,
    });

    await ctx.request.post('/v1/waves').set(authHeaders(coach.id)).send({
      sessionId: newSessionId,
      academyId,
      videoAssetId: newAsset.id,
      title: 'Wave 4',
      durationSeconds: 20,
    });

    const res = await ctx.request
      .get(`/v1/academies/${academyId}/stats`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.stats.sessions.allTime).toBe(3);
    expect(res.body.stats.waves.total).toBe(4);
  });
});
