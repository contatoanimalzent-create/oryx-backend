import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });

  it('returns ISO 8601 timestamp', () => {
    const result = controller.check();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns non-negative uptime', () => {
    const result = controller.check();
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });
});
