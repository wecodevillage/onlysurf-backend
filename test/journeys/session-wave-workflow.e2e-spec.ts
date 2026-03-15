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

describe('Session & Wave Workflow Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;
  let athlete1: TestUser;
  let athlete2: TestUser;
  let academyId: string;
  let sessionId: string;
  let videoAssetId: string;
  let waveId: string;
  let wave2Id: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);

    coach = await createTestCoach(ctx.prisma);
    athlete1 = await createTestAthlete(ctx.prisma);
    athlete2 = await createTestAthlete(ctx.prisma);

    // Create academy and add athletes
    const academyRes = await ctx.request
      .post('/v1/academies')
      .set(authHeaders(coach.id))
      .send({ name: 'Wave Academy' });
    academyId = academyRes.body.academy.id;

    await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete1.id, role: 'ATHLETE' });

    await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete2.id, role: 'ATHLETE' });

    // Create video assets directly in DB (simulates Mux webhook processing)
    const asset = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 45,
    });
    videoAssetId = asset.id;
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Step 1: Coach creates a training session ─────────────────────

  it('POST /v1/sessions → creates session', async () => {
    const res = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({
        academyId,
        title: 'Morning Training Session',
        description: 'Focusing on cutbacks and bottom turns',
        type: 'TRAINING',
        location: "Ribeira d'Ilhas",
        conditions: 'Clean 4-5ft, offshore wind',
        scheduledAt: new Date().toISOString(),
      })
      .expect(201);

    sessionId = res.body.session.id;
    expect(sessionId).toBeDefined();
    expect(res.body.session.title).toBe('Morning Training Session');
    expect(res.body.session.coachId).toBe(coach.id);
    expect(res.body.session.status).toBe('SCHEDULED');
  });

  // ── Step 2: Coach adds athletes to session roster ────────────────

  it('POST /v1/sessions/:id/roster → adds athlete1', async () => {
    const res = await ctx.request
      .post(`/v1/sessions/${sessionId}/roster`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete1.id })
      .expect(201);

    expect(res.body.roster).toBeDefined();
    expect(res.body.roster.athleteId).toBe(athlete1.id);
  });

  it('POST /v1/sessions/:id/roster → adds athlete2', async () => {
    const res = await ctx.request
      .post(`/v1/sessions/${sessionId}/roster`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete2.id })
      .expect(201);

    expect(res.body.roster.athleteId).toBe(athlete2.id);
  });

  // ── Step 3: Coach creates waves in session ───────────────────────

  it('POST /v1/waves → creates wave 1', async () => {
    const res = await ctx.request
      .post('/v1/waves')
      .set(authHeaders(coach.id))
      .send({
        sessionId,
        academyId,
        videoAssetId,
        title: 'Cutback attempt',
        description: 'Athlete 1 cutback on the right section',
        startTime: 0,
        endTime: 12,
        durationSeconds: 12,
      })
      .expect(201);

    waveId = res.body.wave.id;
    expect(waveId).toBeDefined();
    expect(res.body.wave.title).toBe('Cutback attempt');
  });

  it('POST /v1/waves → creates wave 2', async () => {
    const asset2 = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 20,
    });

    const res = await ctx.request
      .post('/v1/waves')
      .set(authHeaders(coach.id))
      .send({
        sessionId,
        academyId,
        videoAssetId: asset2.id,
        title: 'Bottom turn',
        startTime: 0,
        endTime: 8,
        durationSeconds: 8,
      })
      .expect(201);

    wave2Id = res.body.wave.id;
    expect(wave2Id).toBeDefined();
  });

  // ── Step 4: Coach tags athletes in waves ─────────────────────────

  it('POST /v1/waves/:id/tags → tags athlete1 in wave 1', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${waveId}/tags`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete1.id })
      .expect(201);

    expect(res.body.tag).toBeDefined();
    expect(res.body.tag.athleteId).toBe(athlete1.id);
  });

  it('POST /v1/waves/:id/tags → tags athlete2 in wave 2', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${wave2Id}/tags`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete2.id })
      .expect(201);

    expect(res.body.tag.athleteId).toBe(athlete2.id);
  });

  // ── Step 5: List waves with filters ──────────────────────────────

  it('GET /v1/waves?sessionId → lists waves by session', async () => {
    const res = await ctx.request
      .get(`/v1/waves?sessionId=${sessionId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.waves.length).toBe(2);
  });

  it('GET /v1/waves?athleteId → filters waves by tagged athlete', async () => {
    const res = await ctx.request
      .get(`/v1/waves?athleteId=${athlete1.id}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.waves.length).toBeGreaterThanOrEqual(1);
    const waveIds = res.body.waves.map((w: any) => w.id);
    expect(waveIds).toContain(waveId);
  });

  // ── Step 6: Get wave details ─────────────────────────────────────

  it('GET /v1/waves/:id → returns full wave details', async () => {
    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const wave = res.body.wave;
    expect(wave.id).toBe(waveId);
    expect(wave.title).toBe('Cutback attempt');
    expect(wave.sessionId).toBe(sessionId);
    expect(wave.videoAssetId).toBe(videoAssetId);
  });

  // ── Step 7: Update wave ──────────────────────────────────────────

  it('PATCH /v1/waves/:id → updates wave title', async () => {
    const res = await ctx.request
      .patch(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .send({ title: 'Great cutback attempt' })
      .expect(200);

    expect(res.body.wave.title).toBe('Great cutback attempt');
  });

  // ── Step 8: Update session status ────────────────────────────────

  it('PATCH /v1/sessions/:id → marks session as completed', async () => {
    const res = await ctx.request
      .patch(`/v1/sessions/${sessionId}`)
      .set(authHeaders(coach.id))
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(res.body.session.status).toBe('COMPLETED');
  });

  // ── Step 9: Get session details (includes roster + waves) ────────

  it('GET /v1/sessions/:id → returns session with roster and waves', async () => {
    const res = await ctx.request
      .get(`/v1/sessions/${sessionId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const session = res.body.session;
    expect(session.id).toBe(sessionId);
    expect(session.roster.length).toBe(2);
    expect(session.waves.length).toBe(2);
  });

  // ── Step 10: Get session summary ─────────────────────────────────

  it('GET /v1/sessions/:id/summary → returns session stats', async () => {
    const res = await ctx.request
      .get(`/v1/sessions/${sessionId}/summary`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.totalWaves).toBeGreaterThanOrEqual(2);
    expect(res.body.athleteCount).toBeGreaterThanOrEqual(2);
  });

  // ── Step 11: List sessions with filters ──────────────────────────

  it('GET /v1/sessions → lists sessions', async () => {
    const res = await ctx.request
      .get('/v1/sessions')
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /v1/sessions?status=COMPLETED → filters by status', async () => {
    const res = await ctx.request
      .get('/v1/sessions?status=COMPLETED')
      .set(authHeaders(coach.id))
      .expect(200);

    res.body.sessions.forEach((s: any) => {
      expect(s.status).toBe('COMPLETED');
    });
  });

  // ── Step 12: Delete wave ─────────────────────────────────────────

  it('DELETE /v1/waves/:id → deletes wave', async () => {
    await ctx.request
      .delete(`/v1/waves/${wave2Id}`)
      .set(authHeaders(coach.id))
      .expect(200);

    // Verify it's gone
    await ctx.request
      .get(`/v1/waves/${wave2Id}`)
      .set(authHeaders(coach.id))
      .expect(404);
  });

  // ── Step 13: Delete session ──────────────────────────────────────

  it('DELETE /v1/sessions/:id → deletes session and cascades', async () => {
    // Create a disposable session to delete
    const sessionRes = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ title: 'To Delete', type: 'FREE_SURF' });
    const deleteSessionId = sessionRes.body.session.id;

    await ctx.request
      .delete(`/v1/sessions/${deleteSessionId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    await ctx.request
      .get(`/v1/sessions/${deleteSessionId}`)
      .set(authHeaders(coach.id))
      .expect(404);
  });
});
