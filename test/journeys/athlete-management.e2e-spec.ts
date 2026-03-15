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
  TestUser,
} from '../helpers/seed.helper';
import { cleanDatabase } from '../helpers/db.helper';

describe('Athlete Management Journey', () => {
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

    // Coach creates academy
    const res = await ctx.request
      .post('/v1/academies')
      .set(authHeaders(coach.id))
      .send({ name: 'Test Academy' });
    academyId = res.body.academy.id;
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Step 1: Coach adds athletes to academy ───────────────────────

  it('POST /v1/academies/:id/invites → adds athlete1', async () => {
    const res = await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete1.id, role: 'ATHLETE' })
      .expect(201);

    expect(res.body.membership).toBeDefined();
    expect(res.body.membership.userId).toBe(athlete1.id);
    expect(res.body.membership.role).toBe('ATHLETE');
  });

  it('POST /v1/academies/:id/invites → adds athlete2', async () => {
    const res = await ctx.request
      .post(`/v1/academies/${academyId}/invites`)
      .set(authHeaders(coach.id))
      .send({ userId: athlete2.id, role: 'ATHLETE' })
      .expect(201);

    expect(res.body.membership.userId).toBe(athlete2.id);
  });

  // ── Step 2: List academy members ─────────────────────────────────

  it('GET /v1/academies/:id/members → includes coach + 2 athletes', async () => {
    const res = await ctx.request
      .get(`/v1/academies/${academyId}/members`)
      .set(authHeaders(coach.id))
      .expect(200);

    const members = res.body.members;
    expect(members.length).toBeGreaterThanOrEqual(3);

    const roles = members.map((m: any) => m.role);
    expect(roles).toContain('OWNER');
    expect(roles.filter((r: string) => r === 'ATHLETE').length).toBe(2);
  });

  // ── Step 3: List athletes (optionally by academy) ────────────────

  it('GET /v1/athletes → lists all athletes', async () => {
    const res = await ctx.request
      .get('/v1/athletes')
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.athletes.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /v1/athletes?academyId → filters athletes by academy', async () => {
    const res = await ctx.request
      .get(`/v1/athletes?academyId=${academyId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const ids = res.body.athletes.map((a: any) => a.id);
    expect(ids).toContain(athlete1.id);
    expect(ids).toContain(athlete2.id);
  });

  // ── Step 4: Get athlete details ──────────────────────────────────

  it('GET /v1/athletes/:id → returns athlete details', async () => {
    const res = await ctx.request
      .get(`/v1/athletes/${athlete1.id}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const athlete = res.body.athlete;
    expect(athlete.id).toBe(athlete1.id);
    expect(athlete.email).toBe(athlete1.email);
    expect(athlete.role).toBe('ATHLETE');
  });

  // ── Step 5: Athlete updates own profile ──────────────────────────

  it('PATCH /v1/auth/me/profile → athlete updates own profile', async () => {
    const res = await ctx.request
      .patch('/v1/auth/me/profile')
      .set(authHeaders(athlete1.id))
      .send({
        firstName: 'Miguel',
        lastName: 'Costa',
        displayName: 'Miguel Costa',
        stance: 'GOOFY',
        level: 'INTERMEDIATE',
      })
      .expect(200);

    expect(res.body.profile.firstName).toBe('Miguel');
    expect(res.body.profile.stance).toBe('GOOFY');
  });

  // ── Step 6: Get athlete stats (initially empty) ──────────────────

  it('GET /v1/athletes/:id/stats → returns zeroed stats', async () => {
    const res = await ctx.request
      .get(`/v1/athletes/${athlete1.id}/stats`)
      .set(authHeaders(coach.id))
      .expect(200);

    const stats = res.body.stats;
    expect(stats).toBeDefined();
    expect(stats.totalWaves).toBe(0);
    expect(stats.totalSessions).toBe(0);
  });

  // ── Step 7: Athlete cannot create academy ────────────────────────

  it('POST /v1/academies → 403 for athlete', async () => {
    await ctx.request
      .post('/v1/academies')
      .set(authHeaders(athlete1.id))
      .send({ name: 'Should Fail' })
      .expect(403);
  });
});
