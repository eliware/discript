import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

function apiFor(message) {
  return createDiscordApi({ channels: { cache: new Map([['1', { messages: { fetch: jest.fn(async () => message) } }]]) } }, { yes: true });
}

describe('message capabilities', () => {
  test('gets and edits a message', async () => {
    const message = { id: '2', channelId: '1', content: 'old', edit: jest.fn(async content => ({ ...message, content })) };
    const api = apiFor(message);
    await expect(api.messages.get('1', '2')).resolves.toMatchObject({ id: '2', content: 'old' });
    await expect(api.messages.edit('1', '2', 'new')).resolves.toMatchObject({ content: 'new' });
    expect(message.edit).toHaveBeenCalledWith('new');
  });

  test('deletes a message with approval', async () => {
    const message = { id: '2', channelId: '1', content: 'old', delete: jest.fn() };
    await expect(apiFor(message).messages.delete('1', '2')).resolves.toEqual({ id: '2', deleted: true });
    expect(message.delete).toHaveBeenCalled();
  });

  test('accepts script-level force and dry-run options', async () => {
    const message = { id: '2', channelId: '1', content: 'old', delete: jest.fn() };
    const api = createDiscordApi({ channels: { cache: new Map([['1', { messages: { fetch: jest.fn(async () => message) } }]]) } });
    await expect(api.messages.delete('1', '2', { dryRun: true })).resolves.toMatchObject({ dryRun: true });
    await expect(api.messages.delete('1', '2', { force: true })).resolves.toEqual({ id: '2', deleted: true });
  });
});
