import './setup-e2e';
import { TestContext, createTestApp, destroyTestApp } from './helpers/test-app';

describe('App Health (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await destroyTestApp(ctx);
  });

  it('GET /v1/health → returns ok', async () => {
    const res = await ctx.request.get('/v1/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('onlysurf-api');
    expect(res.body.timestamp).toBeDefined();
  });
});
