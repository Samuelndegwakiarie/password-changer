import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('Recoverly Optional API & Secret Rejection Policy', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/v1/health returns healthy service status', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
  });

  it('GET /api/v1/catalog/adapters returns adapter catalog', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/catalog/adapters',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.adapters).toHaveLength(3);
  });

  it('POST /api/v1/telemetry accepts clean telemetry without secrets', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/telemetry',
      payload: {
        eventName: 'adapter_completed',
        adapterId: 'github',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.received).toBe(true);
  });

  it('REJECTS requests containing password or credentials with HTTP 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/telemetry',
      payload: {
        eventName: 'leak_attempt',
        password: 'SuperSecretPassword!',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('prohibits transmission of credentials');
  });

  it('REJECTS requests containing session cookies or vault exports with HTTP 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/consent',
      payload: {
        userId: '123',
        cookie: 'session_id=abcdef',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('prohibits transmission of credentials');
  });
});
