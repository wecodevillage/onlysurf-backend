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

describe('Notifications Journey', () => {
  let ctx: TestContext;
  let coach: TestUser;
  let athlete: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanDatabase(ctx.prisma);

    coach = await createTestCoach(ctx.prisma);
    athlete = await createTestAthlete(ctx.prisma);
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  // ── Desktop Push Subscriptions ───────────────────────────────────

  it('GET /v1/notifications/desktop/public-key → returns VAPID key', async () => {
    const res = await ctx.request
      .get('/v1/notifications/desktop/public-key')
      .set(authHeaders(athlete.id))
      .expect(200);

    expect(res.body).toBeDefined();
    // publicKey may be null if VAPID keys not configured
    expect(res.body).toHaveProperty('publicKey');
  });

  it('POST /v1/notifications/desktop/subscribe → subscribes athlete', async () => {
    const res = await ctx.request
      .post('/v1/notifications/desktop/subscribe')
      .set(authHeaders(athlete.id))
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-subscription-123',
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXkZGE',
          auth: 'tBHItJI5svbXC318CASQSQ',
        },
      })
      .expect(201);

    expect(res.body.subscription).toBeDefined();
    expect(res.body.subscription.userId).toBe(athlete.id);
  });

  it('POST /v1/notifications/desktop/subscribe → second device', async () => {
    const res = await ctx.request
      .post('/v1/notifications/desktop/subscribe')
      .set(authHeaders(athlete.id))
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-subscription-456',
        keys: {
          p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JyL4lh3CSVHM1SB_pRN2oGgFtWCP',
          auth: 'vv1RhP4yKRWYEVUHxJEKjA',
        },
      })
      .expect(201);

    expect(res.body.subscription).toBeDefined();
  });

  it('subscriptions are stored in database', async () => {
    const subs = await ctx.prisma.notificationSubscription.findMany({
      where: { userId: athlete.id },
    });

    expect(subs.length).toBe(2);
  });

  it('DELETE /v1/notifications/desktop/subscribe → unsubscribes', async () => {
    await ctx.request
      .delete('/v1/notifications/desktop/subscribe')
      .set(authHeaders(athlete.id))
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-subscription-123',
      })
      .expect(200);

    const subs = await ctx.prisma.notificationSubscription.findMany({
      where: { userId: athlete.id },
    });

    expect(subs.length).toBe(1);
  });

  // ── Auth required for protected endpoints ────────────────────────

  it('POST /v1/notifications/desktop/subscribe → 401 without auth', async () => {
    await ctx.request
      .post('/v1/notifications/desktop/subscribe')
      .send({
        endpoint: 'https://example.com/push',
        keys: { p256dh: 'key', auth: 'auth' },
      })
      .expect(401);
  });
});
