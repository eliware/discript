import { describe, expect, test } from '@jest/globals';
import { run } from '../src/cli.mjs';

describe('CLI execution', () => {
  test('returns help without connecting', async () => {
    const output = [];
    await run(['--help'], { stdout: value => output.push(value) });
    expect(output[0]).toContain('Usage: discript');
  });

  test('rejects invalid timeouts', async () => {
    await expect(run(['--timeout', '0', '--eval', '1'])).rejects.toMatchObject({ code: 'INVALID_TIMEOUT' });
  });

  test('prints a redacted effective configuration', async () => {
    const output = [];
    await run(['config', '--json'], { stdout: value => output.push(value) });
    const config = JSON.parse(output[0]);
    expect(config).toEqual(expect.objectContaining({ mcp: expect.any(Object), client: expect.any(Object) }));
    expect([null, '[redacted]']).toContain(config.token);
    expect(JSON.stringify(config)).not.toContain(process.env.DISCORD_TOKEN ?? 'token-that-is-not-set');
  });
});
