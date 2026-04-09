import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildApp } from '../app';

let app: ReturnType<typeof buildApp>;
let tmpDir: string;
let dbPath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todos-test-'));
  dbPath = path.join(tmpDir, 'test.db');
  app = buildApp({ dbPath });
  await app.ready();
});

afterEach(async () => {
  await app.close();
  fs.rmSync(tmpDir, { recursive: true });
});

// ─── GET /api/todos ───────────────────────────────────────────────────────────

describe('GET /api/todos', () => {
  it('returns 200 with empty array when no todos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns 200 with array of 2 todos, newest first', async () => {
    // Insert two todos sequentially
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'First todo' }),
    });
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'Second todo' }),
    });

    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    // SQLite datetime('now') has second-level precision; both may share the same timestamp.
    // AUTOINCREMENT id is always strictly increasing, so higher id = inserted later = "newest".
    // When created_at ties, rely on id ordering as the tiebreak proxy.
    expect(body[0].id).toBeGreaterThan(body[1].id);
  });

  it('each todo has correct shape with boolean completed and ISO createdAt', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'Shape check' }),
    });
    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    const [todo] = res.json();
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.text).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.completed).toBe(false);
    expect(typeof todo.createdAt).toBe('string');
    // ISO 8601 pattern check
    expect(new Date(todo.createdAt).toISOString()).toBeTruthy();
  });
});

// ─── POST /api/todos ──────────────────────────────────────────────────────────

describe('POST /api/todos', () => {
  it('returns 201 with Todo shape for valid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'Buy milk' }),
    });
    expect(res.statusCode).toBe(201);
    const todo = res.json();
    expect(todo).toMatchObject({ text: 'Buy milk', completed: false });
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.createdAt).toBe('string');
  });

  it('returns 400 for empty string text', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: '' }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('message');
  });

  it('returns 400 for whitespace-only text', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: '   ' }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('message');
  });

  it('returns 400 for missing text field', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({}),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('message');
  });

  it('returns 400 for text of 501 chars', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'a'.repeat(501) }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('message');
  });

  it('returns 201 for text of exactly 500 chars', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'a'.repeat(500) }),
    });
    expect(res.statusCode).toBe(201);
  });
});

// ─── PATCH /api/todos/:id ─────────────────────────────────────────────────────

describe('PATCH /api/todos/:id', () => {
  let todoId: number;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'Patch me' }),
    });
    todoId = res.json().id;
  });

  it('returns 200 with completed: true when toggling on', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${todoId}`,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ completed: true }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: todoId, completed: true });
  });

  it('returns 200 with completed: false when toggling off', async () => {
    // First set to true
    await app.inject({
      method: 'PATCH',
      url: `/api/todos/${todoId}`,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ completed: true }),
    });
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${todoId}`,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ completed: false }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: todoId, completed: false });
  });

  it('returns 404 with { message } for non-existent id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/todos/999999',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ completed: true }),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty('message');
  });
});

// ─── DELETE /api/todos/:id ────────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  let todoId: number;

  beforeEach(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: 'Delete me' }),
    });
    todoId = res.json().id;
  });

  it('returns 204 with no body for existing id', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/api/todos/${todoId}` });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });

  it('returns 404 with { message } for non-existent id', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/todos/999999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty('message');
  });

  it('deleted todo no longer appears in GET /api/todos', async () => {
    await app.inject({ method: 'DELETE', url: `/api/todos/${todoId}` });
    const res = await app.inject({ method: 'GET', url: '/api/todos' });
    const ids = res.json().map((t: { id: number }) => t.id);
    expect(ids).not.toContain(todoId);
  });
});

// ─── Error shape ──────────────────────────────────────────────────────────────

describe('Error shape', () => {
  it('400 response is { message: string } not Fastify default shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ text: '' }),
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(typeof body.message).toBe('string');
    // Must NOT have Fastify's default extra fields
    expect(body).not.toHaveProperty('statusCode');
    expect(body).not.toHaveProperty('error');
  });
});
