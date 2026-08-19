import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@jest/globals';

const binary = fileURLToPath(new URL('../bin/discript.mjs', import.meta.url));

describe('process contract', () => {
  test('returns zero and help on stdout', () => {
    const output = execFileSync(process.execPath, [binary, '--help'], { encoding: 'utf8' });
    expect(output).toContain('Usage: discript');
  });

  test('returns stable invalid-input status and JSON error on stderr', () => {
    let error;
    try {
      execFileSync(process.execPath, [binary, '-z', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (caught) {
      error = caught;
    }
    expect(error.status).toBe(2);
    expect(JSON.parse(error.stderr)).toMatchObject({ code: 'INVALID_OPTION' });
    expect(error.stdout).toBe('');
  });
});
