import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VALID_DB_URL = 'postgresql://user:pass@localhost:5432/db';

describe('loadEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('applies defaults when optional env vars are missing', async () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    process.env.DATABASE_URL = VALID_DB_URL;

    const { loadEnv } = await import('./env');
    const env = loadEnv();

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.DATABASE_URL).toBe(VALID_DB_URL);
  });

  it('coerces PORT to number', async () => {
    process.env.PORT = '8080';
    process.env.DATABASE_URL = VALID_DB_URL;
    const { loadEnv } = await import('./env');
    expect(loadEnv().PORT).toBe(8080);
  });

  it('exits the process when PORT is invalid', async () => {
    process.env.PORT = 'not-a-number';
    process.env.DATABASE_URL = VALID_DB_URL;
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

  it('exits when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow(/exit:1/);

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('exits when DATABASE_URL is not a postgres scheme', async () => {
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow(/exit:1/);

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
