import { describe, expect, test } from '@jest/globals';
import { formatError } from '../src/errors.mjs';

describe('CLI errors', () => {
  test('formats machine-readable errors', () => {
    expect(formatError(Object.assign(new Error('bad option'), { code: 'INVALID_OPTION' }), { json: true })).toBe('{"error":"bad option","code":"INVALID_OPTION"}');
  });

  test('includes structured suggestions when available', () => {
    expect(formatError(Object.assign(new Error('Unknown command'), { code: 'UNKNOWN_COMMAND', details: { suggestions: ['messages send'] } }), { json: true })).toBe('{"error":"Unknown command","code":"UNKNOWN_COMMAND","details":{"suggestions":["messages send"]}}');
  });
});
