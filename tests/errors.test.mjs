import { describe, expect, test } from '@jest/globals';
import { formatError, structuredError } from '../src/errors.mjs';
import { createRequestId, executionFailure, executionSuccess, isExecutionResult } from '../src/execution/result.mjs';

describe('CLI errors', () => {
  test('formats machine-readable errors', () => {
    expect(formatError(Object.assign(new Error('bad option'), { code: 'INVALID_OPTION' }), { json: true })).toBe('{"error":"bad option","code":"INVALID_OPTION","exitCode":2}');
  });

  test('includes structured suggestions when available', () => {
    expect(formatError(Object.assign(new Error('Unknown command'), { code: 'UNKNOWN_COMMAND', details: { suggestions: ['messages send'] } }), { json: true })).toBe('{"error":"Unknown command","code":"UNKNOWN_COMMAND","exitCode":1,"details":{"suggestions":["messages send"]}}');
  });

  test('normalizes Discord API failures without leaking arbitrary error fields', () => {
    const error = Object.assign(new Error('Missing Access'), {
      name: 'DiscordAPIError', code: 50001, status: 403, method: 'GET', path: '/guilds/1',
      requestBody: { token: 'secret' }, details: { discordCode: 50001, status: 403, method: 'GET', path: '/guilds/1', token: 'secret' },
    });
    expect(structuredError(error)).toEqual({
      error: 'Missing Access', code: 'DISCORD_API_ERROR', exitCode: 5,
      details: { discordCode: 50001, status: 403, method: 'GET', path: '/guilds/1' },
    });
  });

  test('redacts credentials embedded in error text and allowed details', () => {
    const error = Object.assign(new Error('request failed DISCORD_TOKEN=discord-secret Bearer bearer-secret'), {
      code: 'REMOTE_ERROR', details: { message: 'oauth_secret=oauth-secret', path: '/mcp' },
    });
    const result = structuredError(error);
    expect(result.error).toBe('request failed DISCORD_TOKEN=[redacted] Bearer [redacted]');
    expect(result.details.message).toBe('oauth_secret=[redacted]');
    expect(JSON.stringify(result)).not.toContain('discord-secret');
    expect(JSON.stringify(result)).not.toContain('bearer-secret');
    expect(JSON.stringify(result)).not.toContain('oauth-secret');
  });

  test('creates unique request ids', () => {
    expect(createRequestId()).toEqual(expect.any(String));
    expect(createRequestId()).not.toBe(createRequestId());
  });
  test('creates a complete execution success envelope', () => {
    expect(executionSuccess(3, { requestId: 'r' })).toEqual({ ok: true, requestId: 'r', exitCode: 0, value: 3, warnings: [], diagnostics: [] });
  });
  test('creates a sanitized execution failure envelope', () => {
    expect(executionFailure(Object.assign(new Error('bad'), { code: 'BAD', exitCode: 7 }), { requestId: 'r' })).toMatchObject({ ok: false, requestId: 'r', code: 'BAD', exitCode: 7, error: 'bad' });
  });
  test('recognizes execution envelopes', () => {
    expect(isExecutionResult(executionSuccess(null))).toBe(true);
    expect(isExecutionResult({ ok: true })).toBe(false);
  });
  test('preserves warning and diagnostic arrays', () => {
    expect(executionSuccess('x', { warnings: ['w'], diagnostics: ['d'] })).toMatchObject({ warnings: ['w'], diagnostics: ['d'] });
  });
});
