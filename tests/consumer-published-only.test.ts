import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createVocabulary, createGrammar } from './setup';
import Vocabulary from '../src/models/Vocabulary';
import Grammar from '../src/models/Grammar';

describe('Consumer APIs should only return published content', () => {
  let token: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    const created = await createTestUser({ role: 'learner' });
    token = created.token;
  });

  afterEach(async () => {
    await clearCollections();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('vocabulary list returns only published items', async () => {
    await createVocabulary({ word: 'draft', status: 'draft' });
    await createVocabulary({ word: 'pub', status: 'published' });

    const res = await request(app)
      .get('/api/v1/vocabulary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = res.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((d: any) => d.word === 'pub')).toBe(true);
    expect(data.some((d: any) => d.word === 'draft')).toBe(false);
  });

  it('grammar list returns only published items', async () => {
    await createGrammar({ title: 'draft grammar', status: 'draft' });
    await createGrammar({ title: 'published grammar', status: 'published' });

    const res = await request(app)
      .get('/api/v1/grammar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const data = res.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((d: any) => d.title === 'published grammar')).toBe(true);
    expect(data.some((d: any) => d.title === 'draft grammar')).toBe(false);
  });
});
