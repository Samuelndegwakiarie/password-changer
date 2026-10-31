import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export function buildServer(): FastifyInstance {
  const server = Fastify({
    logger: false,
  });

  // Security Headers
  server.register(helmet, {
    contentSecurityPolicy: true,
  });

  // CORS
  server.register(cors, {
    origin: (origin, cb) => {
      // Allow Chrome extensions or local dev
      if (!origin || origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost:')) {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed by CORS'), false);
    },
  });

  // Rate Limiting
  server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Strict Request Body Security Guard: Reject any attempt to transmit secrets/credentials
  server.addHook('preValidation', async (request, reply) => {
    if (request.body && typeof request.body === 'object') {
      const bodyStr = JSON.stringify(request.body).toLowerCase();
      const forbiddenKeys = [
        '"password"',
        '"password_hash"',
        '"secret"',
        '"cookie"',
        '"otp"',
        '"recovery_code"',
        '"vault_export"',
      ];

      for (const key of forbiddenKeys) {
        if (bodyStr.includes(key)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Recoverly API strictly prohibits transmission of credentials or secrets (${key}).`,
          });
        }
      }
    }
  });

  // Routes
  server.get('/api/v1/health', async () => {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      service: 'Recoverly Metadata & Compatibility API',
    };
  });

  server.get('/api/v1/catalog/adapters', async () => {
    return {
      updatedAt: '2026-10-31T00:00:00.000Z',
      adapters: [
        {
          id: 'well-known-change-password',
          name: 'RFC 8615 Standard',
          version: 1,
          enabled: true,
          documentationUrl: 'https://www.rfc-editor.org/rfc/rfc8615',
        },
        {
          id: 'github',
          name: 'GitHub Security',
          version: 1,
          enabled: true,
          domains: ['github.com'],
        },
        {
          id: 'google',
          name: 'Google Account Password Page',
          version: 1,
          enabled: true,
          domains: ['google.com', 'myaccount.google.com'],
          note: 'Direct vault editing is not supported by Google. Navigates to standard password change route.',
        },
      ],
    };
  });

  server.get('/api/v1/releases', async () => {
    return {
      currentVersion: '1.0.0',
      minimumSupportedVersion: '1.0.0',
      releaseNotesUrl: 'https://github.com/recoverly/recoverly/releases',
    };
  });

  server.post('/api/v1/consent', async (request, reply) => {
    const body = request.body as { userId?: string; telemetry?: boolean; breachCheck?: boolean };
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ error: 'Invalid consent payload' });
    }
    return {
      recorded: true,
      timestamp: new Date().toISOString(),
      telemetry: Boolean(body.telemetry),
      breachCheck: Boolean(body.breachCheck),
    };
  });

  server.post('/api/v1/telemetry', async (request, reply) => {
    const body = request.body as { eventName?: string; adapterId?: string; failureCode?: string };
    if (!body || !body.eventName) {
      return reply.status(400).send({ error: 'eventName is required' });
    }
    return {
      received: true,
      timestamp: new Date().toISOString(),
    };
  });

  return server;
}
