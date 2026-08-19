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
});
