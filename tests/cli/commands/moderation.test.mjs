import { describe, expect, test } from '@jest/globals';
import { createModerationHandler } from '../../../src/cli/commands/moderation.mjs';

describe('moderation command handler', () => {
  const m = { ban: r => ['ban', r], kick: r => ['kick', r], timeout: (d,r) => ['timeout',d,r] }; const api = { guilds: { get: () => ({ members: { get: () => m } }) } };
  test.each([['ban', {}, ['ban', undefined]], ['kick', { reason: 'x' }, ['kick', 'x']], ['timeout', { duration: '10', reason: 'x' }, ['timeout', '10', 'x']]])('%s', (op, options, value) => expect(createModerationHandler({ command: ['moderation', op], options: { guild: 'g', user: 'u', ...options }, api })).toEqual({ handled: true, value }));
  test('requires target fields', () => expect(() => createModerationHandler({ command: ['moderation', 'ban'], options: {}, api })).toThrow());
  test('ignores other commands', () => expect(createModerationHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false }));
});
