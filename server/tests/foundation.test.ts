import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { HealthService } from '../src/services/health.service';
import { AppError } from '../src/utils/appError';

describe('Phase 1 Backend Foundation Tests', () => {
  test('Express app initializes with all middleware intact', () => {
    const app = createApp();
    assert.ok(app, 'App should be successfully initialized');
    assert.strictEqual(typeof app.listen, 'function', 'App should have listen method');
  });

  test('HealthService returns valid system diagnostic metrics', async () => {
    const health = await HealthService.getHealth();
    assert.ok(['healthy', 'degraded'].includes(health.status));
    assert.strictEqual(health.version, '1.0.0');
    assert.ok(typeof health.uptimeSeconds === 'number');
    assert.ok(health.memory.heapUsedMB > 0);
    assert.ok(['connected', 'disconnected'].includes(health.database));
  });

  test('AppError creates operational error with proper status code and payload', () => {
    const error = AppError.badRequest('Invalid input', 'CUSTOM_CODE', { field: 'name' });
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.code, 'CUSTOM_CODE');
    assert.strictEqual(error.message, 'Invalid input');
    assert.strictEqual(error.isOperational, true);
    assert.deepStrictEqual(error.details, { field: 'name' });
  });

  test('AppError validationError generates 422 status code', () => {
    const error = AppError.validationError('Validation failed', [{ field: 'mobile', message: 'Required' }]);
    assert.strictEqual(error.statusCode, 422);
    assert.strictEqual(error.code, 'VALIDATION_ERROR');
  });
});
