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

describe('Saved Waves & Archive Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;
  let athlete: TestUser;
  let academyId: string;
  let sessionId: string;
  let waveId: string;
  let wave2Id: string;
  let savedWaveId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);

    coach = await createTestCoach(ctx.prisma);
    athlete = await createTestAthlete(ctx.prisma);

    // Setup: academy → session → video assets → waves → tag athlete
    const academyRes = await ctx.request
      .post('/v1/academies')
      .set(authHeaders(coach.id))
      .send({ name: 'Archive Test Academy' });
    academyId = academyRes.body.academy.id;

    await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete.id, role: 'ATHLETE' });

    const sessionRes = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ academyId, title: 'Archive Session', type: 'TRAINING' });
    sessionId = sessionRes.body.session.id;

    const asset1 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 30,
    });
    const asset2 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 25,
    });

    const wave1Res = await ctx.request
      .post('/v1/waves')
      .set(authHeaders(coach.id))
      .send({
        sessionId,
        academyId,
        videoAssetId: asset1.id,
        title: 'Big barrel',
        durationSeconds: 30,
      });
    waveId = wave1Res.body.wave.id;

    const wave2Res = await ctx.request
      .post('/v1/waves')
      .set(authHeaders(coach.id))
      .send({
        sessionId,
        academyId,
        videoAssetId: asset2.id,
        title: 'Snap on the lip',
        durationSeconds: 25,
      });
    wave2Id = wave2Res.body.wave.id;

    // Tag athlete in both waves
    await ctx.request
      .post(`/v1/waves/${waveId}/tags`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete.id });

    await ctx.request
      .post(`/v1/waves/${wave2Id}/tags`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete.id });
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Step 1: Athlete saves a wave ─────────────────────────────────

  it('POST /v1/saved-waves → athlete saves wave', async () => {
    const res = await ctx.request
      .post('/v1/saved-waves')
      .set(authHeaders(athlete.id))
      .send({ waveId })
      .expect(201);

    savedWaveId = res.body.savedWave.id;
    expect(savedWaveId).toBeDefined();
    expect(res.body.savedWave.waveId).toBe(waveId);
    expect(res.body.savedWave.athleteId).toBe(athlete.id);
  });

  it('POST /v1/saved-waves → athlete saves second wave', async () => {
    const res = await ctx.request
      .post('/v1/saved-waves')
      .set(authHeaders(athlete.id))
      .send({ waveId: wave2Id })
      .expect(201);

    expect(res.body.savedWave.waveId).toBe(wave2Id);
  });

  // ── Step 2: Athlete lists saved waves ────────────────────────────

  it('GET /v1/saved-waves → returns athlete archive', async () => {
    const res = await ctx.request
      .get('/v1/saved-waves')
      .set(authHeaders(athlete.id))
      .expect(200);

    const savedWaves = res.body.savedWaves;
    expect(savedWaves.length).toBe(2);
    const waveIds = savedWaves.map((sw: any) => sw.waveId);
    expect(waveIds).toContain(waveId);
    expect(waveIds).toContain(wave2Id);
  });

  // ── Step 3: Verify duration snapshots exist ──────────────────────

  it('saved waves have duration snapshots', async () => {
    const res = await ctx.request
      .get('/v1/saved-waves')
      .set(authHeaders(athlete.id))
      .expect(200);

    res.body.savedWaves.forEach((sw: any) => {
      expect(sw.durationSnapshot).toBeDefined();
      expect(typeof sw.durationSnapshot).toBe('number');
    });
  });

  // ── Step 4: Athlete deletes a saved wave ─────────────────────────

  it('DELETE /v1/saved-waves/:id → removes from archive', async () => {
    await ctx.request
      .delete(`/v1/saved-waves/${savedWaveId}`)
      .set(authHeaders(athlete.id))
      .expect(200);

    // Verify archive has one less
    const res = await ctx.request
      .get('/v1/saved-waves')
      .set(authHeaders(athlete.id))
      .expect(200);

    expect(res.body.savedWaves.length).toBe(1);
  });

  // ── Step 5: Original wave still exists ───────────────────────────

  it('GET /v1/waves/:id → original wave is not deleted', async () => {
    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.wave.id).toBe(waveId);
  });

  // ── Step 6: Athlete stats reflect saved waves ────────────────────

  it('GET /v1/athletes/:id/stats → reflects tagged waves', async () => {
    const res = await ctx.request
      .get(`/v1/athletes/${athlete.id}/stats`)
      .set(authHeaders(coach.id))
      .expect(200);

    const stats = res.body.stats;
    expect(stats.totalWaves).toBeGreaterThanOrEqual(2);
  });

  // ── Step 7: Coach cannot access athlete's saved waves ────────────

  it('GET /v1/saved-waves → coach gets own (empty) archive', async () => {
    const res = await ctx.request
      .get('/v1/saved-waves')
      .set(authHeaders(coach.id))
      .expect(200);

    // Coach has no saved waves of their own
    expect(res.body.savedWaves.length).toBe(0);
  });
});
