import '../setup-e2e';
import {
  TestContext,
  createTestApp,
  destroyTestApp,
  authHeaders,
} from '../helpers/test-app';
import { createTestCoach, TestUser } from '../helpers/seed.helper';
import { cleanDatabase } from '../helpers/db.helper';

describe('Billing Flow Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);
    coach = await createTestCoach(ctx.prisma);
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Step 1: Public plans listing ─────────────────────────────────

  it('GET /v1/billing/plans → returns all subscription plans (public)', async () => {
    const res = await ctx.request.get('/v1/billing/plans').expect(200);

    const plans = res.body.plans;
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThanOrEqual(5);

    // Verify expected plan tiers
    const names = plans.map((p: any) => p.name);
    expect(names).toContain('Coach Starter');
    expect(names).toContain('Coach Pro');
    expect(names).toContain('Academy');
    expect(names).toContain('Free Athlete');
    expect(names).toContain('Pro Surfer');
  });

  it('plans include pricing information', async () => {
    const res = await ctx.request.get('/v1/billing/plans').expect(200);

    const coachStarter = res.body.plans.find(
      (p: any) => p.name === 'Coach Starter',
    );
    expect(coachStarter).toBeDefined();
    expect(coachStarter.monthlyPrice).toBeDefined();
    expect(coachStarter.limits).toBeDefined();
    expect(coachStarter.limits.athletes).toBe(10);
    expect(coachStarter.limits.sessions).toBe(20);
    expect(coachStarter.limits.videoMinutes).toBe(120);
  });

  it('plans include feature details and limits', async () => {
    const res = await ctx.request.get('/v1/billing/plans').expect(200);

    const academy = res.body.plans.find((p: any) => p.name === 'Academy');
    expect(academy).toBeDefined();
    expect(academy.limits.athletes).toBe(150);
    expect(academy.limits.sessions).toBe(300);
    expect(academy.limits.videoMinutes).toBe(2000);

    const proSurfer = res.body.plans.find((p: any) => p.name === 'Pro Surfer');
    expect(proSurfer).toBeDefined();
    expect(proSurfer.limits.archiveMinutes).toBe(300);
  });

  // ── Step 2: Unauthenticated request to plans ─────────────────────

  it('GET /v1/billing/plans → works without auth (public endpoint)', async () => {
    // No auth header
    const res = await ctx.request.get('/v1/billing/plans').expect(200);

    expect(res.body.plans).toBeDefined();
    expect(res.body.plans.length).toBeGreaterThan(0);
  });

  // ── Step 3: Health endpoint (also public) ────────────────────────

  it('GET /v1/health → returns service status', async () => {
    const res = await ctx.request.get('/v1/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('onlysurf-api');
  });
});
