import { describe, expect, jest, test } from '@jest/globals';
import { createSafety } from '../../src/discord/safety.mjs';

function safety(options = {}) {
  return createSafety({ client: { channels: { cache: new Map() } }, ...options });
}

describe('mutation safety matrix', () => {
  test.each([
    ['default', {}, 'Creating a channel'],
    ['script operation', {}, 'Deleting a message'],
  ])('%s rejects an unapproved mutation', (_label, options, action) => {
    expect(() => safety(options).requireApproval(action)).toThrow(expect.objectContaining({ code: 'CONFIRMATION_REQUIRED', exitCode: 2 }));
  });

  test('dry-run previews without requiring approval', () => {
    const requireApproval = safety({ dryRun: true }).requireApproval;
    expect(() => requireApproval('Deleting a channel')).not.toThrow();
  });

  test('script-level dry-run previews without approval', () => {
    const requireApproval = safety().requireApproval;
    expect(() => requireApproval('Deleting a channel', { dryRun: true })).not.toThrow();
  });

  test('script-level force approves a mutation', () => {
    const requireApproval = safety().requireApproval;
    expect(() => requireApproval('Deleting a channel', { force: true })).not.toThrow();
  });

  test('CLI yes approves a mutation', () => {
    const requireApproval = safety({ yes: true }).requireApproval;
    expect(() => requireApproval('Deleting a channel')).not.toThrow();
  });

  test('capabilities restrict ordinary and destructive mutations independently', () => {
    const writeOnly = safety({ capabilities: new Set(['discord:write']) }).requireApproval;
    expect(() => writeOnly('Creating a channel', { force: true })).not.toThrow();
    expect(() => writeOnly('Deleting a channel', { force: true })).toThrow(expect.objectContaining({ code: 'CAPABILITY_REQUIRED', details: { capability: 'discord:admin' } }));
    const readOnly = safety({ capabilities: new Set(['discord:read']) }).requireApproval;
    expect(() => readOnly('Creating a channel')).toThrow(expect.objectContaining({ code: 'CAPABILITY_REQUIRED', details: { capability: 'discord:write' } }));
    expect(() => safety({ capabilities: new Set(['discord:admin']) }).requireApproval('Deleting a channel', { force: true })).not.toThrow();
  });

  test('permission checks fail closed when bot permission state is unavailable', () => {
    const requirePermission = safety().requirePermission;
    expect(() => requirePermission({ members: { me: undefined } }, 'ManageChannels')).toThrow(expect.objectContaining({ code: 'MISSING_PERMISSION', exitCode: 5 }));
  });

  test('permission checks accept the required Discord permission', () => {
    const guild = { members: { me: { permissions: { has: jest.fn(() => true) } } } };
    expect(() => safety().requirePermission(guild, 'ManageChannels')).not.toThrow();
    expect(guild.members.me.permissions.has).toHaveBeenCalledWith('ManageChannels');
  });

  test('protected roles and moderation targets are rejected', () => {
    const api = safety();
    const guild = { ownerId: 'owner', members: { me: { id: 'bot', roles: { highest: { position: 10 } } } }, roles: { cache: new Map([['everyone', { id: 'everyone', name: '@everyone' }]]) } };
    expect(() => api.requireManageableRole(guild, 'everyone')).toThrow(expect.objectContaining({ code: 'ROLE_PROTECTED', exitCode: 5 }));
    expect(() => api.requireManageableMember(guild, { id: 'owner', user: {}, roles: { highest: { position: 1 } } })).toThrow(expect.objectContaining({ code: 'MEMBER_PROTECTED', exitCode: 5 }));
  });

  test('channel permission checks fail closed', () => {
    const requireChannelPermission = safety().requireChannelPermission;
    expect(() => requireChannelPermission('missing', 'SendMessages')).not.toThrow();
  });

  test('channel permission checks reject an explicit denial', () => {
    const client = { channels: { cache: new Map([['c', { guild: { members: { me: { permissions: { has: () => false } } } } }]]) } };
    expect(() => createSafety({ client }).requireChannelPermission('c', 'SendMessages')).toThrow(expect.objectContaining({ code: 'MISSING_PERMISSION' }));
  });

  test('managed roles are protected', () => {
    const guild = { members: { me: { roles: { highest: { position: 10 } } } }, roles: { cache: new Map([['r', { managed: true, position: 1 }]]) } };
    expect(() => safety().requireManageableRole(guild, 'r')).toThrow(expect.objectContaining({ code: 'ROLE_PROTECTED' }));
  });

  test('higher roles are rejected', () => {
    const guild = { members: { me: { roles: { highest: { position: 2 } } } }, roles: { cache: new Map([['r', { position: 2 }]]) } };
    expect(() => safety().requireManageableRole(guild, 'r')).toThrow(expect.objectContaining({ code: 'ROLE_HIERARCHY' }));
  });

  test('bot members cannot be moderated', () => {
    const guild = { members: { me: { id: 'bot', roles: { highest: { position: 10 } } } }, roles: { cache: new Map() } };
    expect(() => safety().requireManageableMember(guild, { id: 'u', user: { bot: true }, roles: { highest: { position: 1 } } })).toThrow(expect.objectContaining({ code: 'MEMBER_PROTECTED' }));
  });

  test('equal or higher member roles are rejected', () => {
    const guild = { members: { me: { id: 'bot', roles: { highest: { position: 2 } } } }, roles: { cache: new Map() } };
    expect(() => safety().requireManageableMember(guild, { id: 'u', user: {}, roles: { highest: { position: 2 } } })).toThrow(expect.objectContaining({ code: 'MEMBER_HIERARCHY' }));
  });
});
