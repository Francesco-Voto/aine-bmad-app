import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildApp } from '../app';

describe('GET /health', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns 200 { status: ok, db: ok } when database is reachable', async () => {
    const app = buildApp({ dbPath });
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: 'ok', db: 'ok' });
    await app.close();
  });

  it('returns 503 { status: error, db: error } when database is unreachable', async () => {
    const app = buildApp({ dbPath: '/nonexistent/path/test.db' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body)).toEqual({ status: 'error', db: 'error' });
    await app.close();
  });
});
