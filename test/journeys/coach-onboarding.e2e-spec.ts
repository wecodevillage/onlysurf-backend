import '../setup-e2e';
import {
  TestContext,
  createTestApp,
  destroyTestApp,
  authHeaders,
} from '../helpers/test-app';
import { createTestCoach } from '../helpers/seed.helper';
import { cleanDatabase } from '../helpers/db.helper';
import type { TestUser } from '../helpers/seed.helper';

describe('Coach Onboarding Journey', () => {
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

  // ── Step 1: Coach retrieves own profile ──────────────────────────

  let meData: any;

  it('GET /v1/auth/me → returns current user', async () => {
    const res = await ctx.request
      .get('/v1/auth/me')
      .set(authHeaders(coach.id))
      .expect(200);

    meData = res.body.user;
    expect(meData).toBeDefined();
    expect(meData.id).toBe(coach.id);
    expect(meData.email).toBe(coach.email);
    expect(meData.role).toBe('COACH');
  });

  // ── Step 2: Coach updates profile ────────────────────────────────

  it('PATCH /v1/auth/me/profile → creates/updates profile', async () => {
    const res = await ctx.request
      .patch('/v1/auth/me/profile')
      .set(authHeaders(coach.id))
      .send({
        firstName: 'João',
        lastName: 'Silva',
        displayName: 'Coach João',
        bio: 'Surf coach from Ericeira',
        location: 'Ericeira, Portugal',
        stance: 'REGULAR',
        level: 'ADVANCED',
      })
      .expect(200);

    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.firstName).toBe('João');
    expect(res.body.profile.displayName).toBe('Coach João');
    expect(res.body.profile.stance).toBe('REGULAR');
  });

  // ── Step 3: Coach creates academy ────────────────────────────────

  let academyId: string;

  it('POST /v1/academies → creates academy', async () => {
    const res = await ctx.request
      .post('/v1/academies')
      .set(authHeaders(coach.id))
      .send({
        name: 'Ericeira Surf School',
        description: 'Best surf coaching in Ericeira',
        location: 'Ericeira, Portugal',
        website: 'https://ericeira-surf.pt',
      })
      .expect(201);

    expect(res.body.academy).toBeDefined();
    expect(res.body.academy.name).toBe('Ericeira Surf School');
    academyId = res.body.academy.id;
    expect(academyId).toBeDefined();
  });

  // ── Step 4: Coach views academy details ──────────────────────────

  it('GET /v1/academies/:id → retrieves academy with owner', async () => {
    const res = await ctx.request
      .get(`/v1/academies/${academyId}`)
      .set(authHeaders(coach.id))
      .expect(200);

    const academy = res.body.academy;
    expect(academy.id).toBe(academyId);
    expect(academy.name).toBe('Ericeira Surf School');
    expect(academy.ownerId).toBe(coach.id);
  });

  // ── Step 5: Coach updates academy ────────────────────────────────

  it('PATCH /v1/academies/:id → updates academy', async () => {
    const res = await ctx.request
      .patch(`/v1/academies/${academyId}`)
      .set(authHeaders(coach.id))
      .send({ description: 'Updated description for Ericeira Surf School' })
      .expect(200);

    expect(res.body.academy.description).toBe(
      'Updated description for Ericeira Surf School',
    );
  });

  // ── Step 6: Coach is listed as academy member ────────────────────

  it('GET /v1/academies/:id/members → coach appears as OWNER', async () => {
    const res = await ctx.request
      .get(`/v1/academies/${academyId}/members`)
      .set(authHeaders(coach.id))
      .expect(200);

    const members = res.body.members;
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThanOrEqual(1);

    const ownerMember = members.find((m: any) => m.userId === coach.id);
    expect(ownerMember).toBeDefined();
    expect(ownerMember.role).toBe('OWNER');
  });

  // ── Step 7: Coach adds social networks ───────────────────────────

  let socialNetworkId: string;

  it('POST /v1/auth/me/social-networks → adds social network', async () => {
    const res = await ctx.request
      .post('/v1/auth/me/social-networks')
      .set(authHeaders(coach.id))
      .send({
        type: 'INSTAGRAM',
        value: '@coachjoao',
        privacy: 'PUBLIC',
      })
      .expect(201);

    expect(res.body.socialNetwork).toBeDefined();
    socialNetworkId = res.body.socialNetwork.id;
  });

  it('GET /v1/auth/me/social-networks → lists social networks', async () => {
    const res = await ctx.request
      .get('/v1/auth/me/social-networks')
      .set(authHeaders(coach.id))
      .expect(200);

    expect(res.body.socialNetworks.length).toBe(1);
    expect(res.body.socialNetworks[0].type).toBe('INSTAGRAM');
  });

  // ── Step 8: Coach adds services ──────────────────────────────────

  it('POST /v1/auth/me/services → adds coaching service', async () => {
    const res = await ctx.request
      .post('/v1/auth/me/services')
      .set(authHeaders(coach.id))
      .send({
        title: '1-on-1 Surf Lesson',
        description: 'Private surf coaching session',
        price: 75.0,
        currency: 'EUR',
      })
      .expect(201);

    expect(res.body.service).toBeDefined();
    expect(res.body.service.title).toBe('1-on-1 Surf Lesson');
  });

  // ── Step 9: Verify full profile via GET /me ──────────────────────

  it('GET /v1/auth/me → returns complete profile with relations', async () => {
    const res = await ctx.request
      .get('/v1/auth/me')
      .set(authHeaders(coach.id))
      .expect(200);

    const user = res.body.user;
    expect(user.profile).toBeDefined();
    expect(user.profile.firstName).toBe('João');
  });
});
