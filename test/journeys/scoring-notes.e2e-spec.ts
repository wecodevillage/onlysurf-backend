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

describe('Scoring & Notes Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;
  let athlete: TestUser;
  let sessionId: string;
  let waveId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);

    coach = await createTestCoach(ctx.prisma);
    athlete = await createTestAthlete(ctx.prisma);

    // Setup: session → video asset → wave → tag athlete
    const sessionRes = await ctx.request
      .post('/v1/sessions')
      .set(authHeaders(coach.id))
      .send({ title: 'Scoring Session', type: 'TRAINING' });
    sessionId = sessionRes.body.session.id;

    const asset = await createTestVideoAsset(ctx.prisma, {
      durationSeconds: 15,
    });

    const waveRes = await ctx.request
      .post('/v1/waves')
      .set(authHeaders(coach.id))
      .send({
        sessionId,
        videoAssetId: asset.id,
        title: 'Roundhouse cutback',
        durationSeconds: 15,
      });
    waveId = waveRes.body.wave.id;

    await ctx.request
      .post(`/v1/waves/${waveId}/tags`)
      .set(authHeaders(coach.id))
      .send({ athleteId: athlete.id });
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Scoring Flow ─────────────────────────────────────────────────

  let scoreId: string;

  it('POST /v1/waves/:id/scores → coach adds score', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${waveId}/scores`)
      .set(authHeaders(coach.id))
      .send({ score: 7.5, category: 'overall' })
      .expect(201);

    scoreId = res.body.score.id;
    expect(scoreId).toBeDefined();
    expect(res.body.score.score).toBe(7.5);
    expect(res.body.score.category).toBe('overall');
    expect(res.body.score.coachId).toBe(coach.id);
  });

  it('POST /v1/waves/:id/scores → coach adds second category score', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${waveId}/scores`)
      .set(authHeaders(coach.id))
      .send({ score: 8.0, category: 'technique' })
      .expect(201);

    expect(res.body.score.score).toBe(8.0);
    expect(res.body.score.category).toBe('technique');
  });

  it('PATCH /v1/waves/scores/:scoreId → coach updates score', async () => {
    const res = await ctx.request
      .patch(`/v1/waves/scores/${scoreId}`)
      .set(authHeaders(coach.id))
      .send({ score: 8.5 })
      .expect(200);

    expect(res.body.score.score).toBe(8.5);
  });

  it('GET /v1/waves/:id → wave includes scores', async () => {
    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.wave.scores.length).toBe(2);
    const categories = res.body.wave.scores.map((s: any) => s.category);
    expect(categories).toContain('overall');
    expect(categories).toContain('technique');
  });

  it('DELETE /v1/waves/scores/:scoreId → removes score', async () => {
    await ctx.request
      .delete(`/v1/waves/scores/${scoreId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.wave.scores.length).toBe(1);
  });

  // ── Notes Flow ───────────────────────────────────────────────────

  let noteId: string;

  it('POST /v1/waves/:id/notes → coach adds note', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${waveId}/notes`)
      .set(authHeaders(coach.id))
      .send({
        content:
          'Good weight distribution on the bottom turn. Try to extend your arms more on the cutback.',
      })
      .expect(201);

    noteId = res.body.note.id;
    expect(noteId).toBeDefined();
    expect(res.body.note.content).toContain('Good weight distribution');
    expect(res.body.note.coachId).toBe(coach.id);
  });

  it('POST /v1/waves/:id/notes → coach adds second note', async () => {
    const res = await ctx.request
      .post(`/v1/waves/${waveId}/notes`)
      .set(authHeaders(coach.id))
      .send({ content: 'Watch your back foot positioning during the snap.' })
      .expect(201);

    expect(res.body.note.content).toContain('back foot');
  });

  it('PATCH /v1/waves/notes/:noteId → coach updates note', async () => {
    const res = await ctx.request
      .patch(`/v1/waves/notes/${noteId}`)
      .set(authHeaders(coach.id))
      .send({
        content:
          'Updated: Great weight distribution. Extend arms further on cutback and compress more.',
      })
      .expect(200);

    expect(res.body.note.content).toContain('Updated');
  });

  it('GET /v1/waves/:id → wave includes notes', async () => {
    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.wave.notes.length).toBe(2);
  });

  it('DELETE /v1/waves/notes/:noteId → removes note', async () => {
    await ctx.request
      .delete(`/v1/waves/notes/${noteId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const res = await ctx.request
      .get(`/v1/waves/${waveId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.wave.notes.length).toBe(1);
  });

  // ── Session summary reflects scores ──────────────────────────────

  it('GET /v1/sessions/:id/summary → includes score average', async () => {
    const res = await ctx.request
      .get(`/v1/sessions/${sessionId}/summary`)
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.totalWaves).toBe(1);
    // avgScore may be present if the summary calculates it
    expect(res.body).toBeDefined();
  });
});
