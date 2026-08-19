import { describe, expect, test } from '@jest/globals';
import { createChannelsHandler } from '../../../src/cli/commands/channels.mjs';

describe('channel command handler', () => {
  const c = { id: 'c', name: 'n', type: 0, parentId: null, position: 1, update: x => ['update', x], delete: () => 'deleted' };
  const api = { guilds: { get: () => ({ channels: { list: () => 'list', create: (n, o) => ['create', n, o] } }) }, channels: { get: () => c } };
  test.each([['list', { guild: 'g' }, 'list'], ['get', { channel: 'c' }, { id: 'c', name: 'n', type: 0, parentId: null, position: 1 }], ['create', { guild: 'g', name: 'n', type: '2', category: 'cat' }, ['create', 'n', { type: '2', parent: 'cat', position: undefined, dryRun: undefined, force: undefined }]], ['delete', { channel: 'c' }, 'deleted']])('%s', (op, options, value) => expect(createChannelsHandler({ command: ['channels', op], options, api })).toEqual({ handled: true, value }));
  test('updates and validates', () => { expect(createChannelsHandler({ command: ['channels', 'update'], options: { channel: 'c', topic: 't' }, api })).toEqual({ handled: true, value: ['update', { name: undefined, topic: 't', parent: undefined, position: undefined, uncategorized: undefined }] }); expect(() => createChannelsHandler({ command: ['channels', 'update'], options: { channel: 'c' }, api })).toThrow(); });
  test('ignores other commands', () => expect(createChannelsHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false }));
});
