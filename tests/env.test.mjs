import { describe, expect, test } from '@jest/globals';
import { createEnvironment } from '../src/env.mjs';

describe('script environment variables', () => {
  test('gets, sets, and clears process-style variables', () => {
    const values = {};
    const env = createEnvironment(values);
    expect(env.get('DISCRIPT_TEST')).toBeNull();
    expect(env.set('DISCRIPT_TEST', 42)).toBe('42');
    expect(env.DISCRIPT_TEST).toBe('42');
    env.DISCRIPT_TEST = 'ready';
    expect(env.get('DISCRIPT_TEST')).toBe('ready');
    expect(env.clear('DISCRIPT_TEST')).toBeNull();
    expect(env.get('DISCRIPT_TEST')).toBeNull();
  });

  test('rejects invalid variable names', () => {
    const env = createEnvironment({});
    expect(() => env.get('NOT-VALID')).toThrow(expect.objectContaining({ code: 'INVALID_ENV_NAME' }));
  });
});
