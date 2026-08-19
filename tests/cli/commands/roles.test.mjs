import { describe, expect, test } from '@jest/globals';
import { createRolesHandler } from '../../../src/cli/commands/roles.mjs';

describe('role command handler', () => {
  const roles = { list: () => 'list', create: x => ['create', x], get: id => ({ update: x => ['update', id, x], delete: () => ['delete', id] }) };
  const member = { addRole: id => ['add', id], removeRole: id => ['remove', id] };
  const api = { guilds: { get: () => ({ roles, members: { get: () => member } }) } };
  test.each([['list', {}, 'list'], ['create', { name: 'r' }, ['create', 'r']], ['update', { role: 'r', name: 'n' }, ['update', 'r', { name: 'n' }]], ['delete', { role: 'r' }, ['delete', 'r']], ['add', { user: 'u', role: 'r' }, ['add', 'r']], ['remove', { user: 'u', role: 'r' }, ['remove', 'r']]])('%s', (op, options, value) => expect(createRolesHandler({ command: ['roles', op], options: { guild: 'g', ...options }, api })).toEqual({ handled: true, value }));
  test('requires operation fields', () => { expect(() => createRolesHandler({ command: ['roles', 'create'], options: { guild: 'g' }, api })).toThrow(); expect(() => createRolesHandler({ command: ['roles', 'add'], options: { guild: 'g', user: 'u' }, api })).toThrow(); });
  test('ignores other commands', () => expect(createRolesHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false }));
});
