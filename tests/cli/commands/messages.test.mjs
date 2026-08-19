import { describe, expect, test } from '@jest/globals';
import { createMessagesHandler } from '../../../src/cli/commands/messages.mjs';

describe('message command handler', () => {
  const ch = { send: x => ['send', x] }; const calls = {}; const api = { channels: { get: () => ch }, messages: {} };
  for (const op of ['list','get','edit','delete','react','pin','unpin','bulkDelete']) api.messages[op] = (...x) => { calls[op] = x; return op; };
  test.each([['send', { content: 'x' }, ['send', 'x']], ['list', {}, 'list'], ['get', { message: 'm' }, 'get'], ['edit', { message: 'm', content: 'x' }, 'edit'], ['delete', { message: 'm' }, 'delete'], ['react', { message: 'm', emoji: '👍' }, 'react'], ['pin', { message: 'm' }, 'pin'], ['unpin', { message: 'm' }, 'unpin'], ['bulk-delete', { message: 'm', messages: 'm1,m2' }, 'bulkDelete']])('%s', (op, options, value) => expect(createMessagesHandler({ command: ['messages', op], options: { channel: 'c', ...options }, api })).toEqual({ handled: true, value }));
  test('requires content/message', () => { expect(() => createMessagesHandler({ command: ['messages', 'send'], options: { channel: 'c' }, api })).toThrow(); expect(() => createMessagesHandler({ command: ['messages', 'get'], options: { channel: 'c' }, api })).toThrow(); });
  test('ignores other commands', () => expect(createMessagesHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false }));
});
