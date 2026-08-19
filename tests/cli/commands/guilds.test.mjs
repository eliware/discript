import { describe, expect, test } from '@jest/globals';
import { createGuildsHandler } from '../../../src/cli/commands/guilds.mjs';

describe('guild command handler', () => {
  const api = { guilds: { list: () => 'list', get: id => ({ id, name: 'Guild' }) } };
  test.each([['list', {}, 'list'], ['get', { guild: '1' }, { id: '1', name: 'Guild' }]])('%s', (op, options, value) => expect(createGuildsHandler({ command: ['guilds', op], options, api })).toEqual({ handled: true, value }));
  test('requires guild for get', () => expect(() => createGuildsHandler({ command: ['guilds', 'get'], options: {}, api })).toThrow(/requires/));
  test('ignores other commands', () => expect(createGuildsHandler({ command: ['bot', 'get'], options: {}, api: {} })).toEqual({ handled: false }));
});
