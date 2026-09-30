import { test, describe } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { createApp } from '../src/app';

describe('Phase 1 HTTP Server and Middleware Pipeline Tests', () => {
  let server: http.Server;
  const PORT = 5099;
  const BASE_URL = `http://localhost:${PORT}`;

  test('Start test server', async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });
  });

  test('GET /api returns API metadata and registered endpoints', async () => {
    const res = await fetch(`${BASE_URL}/api`);
    const json = (await res.json()) as { success: boolean; data: { name: string; version: string } };

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.name, 'Marlin Sea Food ERP API');
  });

  test('GET /api/health returns healthy status and system metrics', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const json = (await res.json()) as {
      success: boolean;
      data: { status: string; version: string; uptimeSeconds: number };
    };

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(['healthy', 'degraded'].includes(json.data.status));
    assert.strictEqual(json.data.version, '1.0.0');
    assert.ok(typeof json.data.uptimeSeconds === 'number');
    assert.ok(typeof (json.data as { uptime: number }).uptime === 'number');
    assert.ok(['connected', 'disconnected'].includes((json.data as { database: string }).database));

    // Verify security headers added by Helmet
    assert.ok(res.headers.get('x-content-type-options') === 'nosniff');
  });

  test('GET /api/health/ping returns pong', async () => {
    const res = await fetch(`${BASE_URL}/api/health/ping`);
    const json = (await res.json()) as { success: boolean; data: { ping: string } };

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.ping, 'pong');
  });

  test('GET /api/non-existent returns structured 404 error response', async () => {
    const res = await fetch(`${BASE_URL}/api/non-existent`);
    const json = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };

    assert.strictEqual(res.status, 404);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, 'ROUTE_NOT_FOUND');
  });

  test('Teardown test server', async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });
});
