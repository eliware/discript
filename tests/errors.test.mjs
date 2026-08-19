import { describe, expect, test } from '@jest/globals';
import { formatError } from '../src/errors.mjs';

describe('CLI errors', () => {
  test('formats machine-readable errors', () => {
    expect(formatError(Object.assign(new Error('bad option'), { code: 'INVALID_OPTION' }), { json: true })).toBe('{"error":"bad option","code":"INVALID_OPTION"}');
  });
});
