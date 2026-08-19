import { describe, expect, test } from '@jest/globals';
import { createMembersHandler } from '../../../src/cli/commands/members.mjs';

describe('member command handler', () => {
  const members = { list: () => 'members', get: id => `member:${id}` };
  const api = { guilds: { get: () => ({ members }) } };
  test('lists and gets', () => { expect(createMembersHandler({ command: ['members', 'list'], options: { guild: 'g' }, api })).toEqual({ handled: true, value: 'members' }); expect(createMembersHandler({ command: ['members', 'get'], options: { guild: 'g', user: 'u' }, api })).toEqual({ handled: true, value: 'member:u' }); });
  test('requires guild and user', () => { expect(() => createMembersHandler({ command: ['members', 'list'], options: {}, api })).toThrow(); expect(() => createMembersHandler({ command: ['members', 'get'], options: { guild: 'g' }, api })).toThrow(); });
  test('ignores other commands', () => expect(createMembersHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false }));
});
