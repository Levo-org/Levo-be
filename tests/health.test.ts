import request from 'supertest';
import app from '@/app';
import { connectTestDb, disconnectTestDb } from './setup';

describe('Health Check — GET /health', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('responds with 200 and correct JSON structure', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('returns a valid ISO 8601 timestamp', async () => {
    const res = await request(app).get('/health');

    const parsed = new Date(res.body.timestamp);
    expect(parsed.toISOString()).toBe(res.body.timestamp);
  });
});

describe('404 Handler — unknown route', () => {
  it('returns 404 with success: false for unknown API paths', async () => {
    const res = await request(app).get('/api/v1/this-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });
});
