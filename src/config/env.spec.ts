import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('applies defaults when env vars are missing', async () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;

    const { loadEnv } = await import('./env');
    const env = loadEnv();

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces PORT to number', async () => {
    process.env.PORT = '8080';
    const { loadEnv } = await import('./env');
    expect(loadEnv().PORT).toBe(8080);
  });

  it('exits the process when env is invalid', async () => {
    process.env.PORT = 'not-a-number';
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow(/exit:1/);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
