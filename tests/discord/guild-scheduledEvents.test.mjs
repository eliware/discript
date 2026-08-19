import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';



describe('scheduled events', () => {
  test('lists and performs guarded lifecycle operations', async () => {
    const edit = jest.fn(async settings => ({ id: 'e1', name: settings.name ?? 'Town hall' }));
    const remove = jest.fn(async () => undefined);
    const create = jest.fn(async settings => ({ id: 'e2', name: settings.name }));
    const guild = {
      id: '1',
      scheduledEvents: { cache: new Map([['e1', { id: 'e1', name: 'Town hall', status: 1, edit, delete: remove }]]), create },
      members: { me: { permissions: { has: () => true } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    expect(api.guilds.get('1').scheduledEvents.list()).toMatchObject([{ id: 'e1', name: 'Town hall' }]);
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch', scheduledStartTime: '2030-01-01T00:00:00.000Z' })).resolves.toEqual({ id: 'e2', name: 'Launch', created: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').update({ name: 'Updated' })).resolves.toEqual({ id: 'e1', name: 'Updated', updated: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').delete()).resolves.toEqual({ id: 'e1', deleted: true });
    expect(create).toHaveBeenCalled();
    expect(edit).toHaveBeenCalledWith({ name: 'Updated' });
    expect(remove).toHaveBeenCalled();
  });

  test('dry-run previews event mutations', async () => {
    const create = jest.fn();
    const edit = jest.fn();
    const remove = jest.fn();
    const guild = { id: '1', scheduledEvents: { cache: new Map([['e1', { id: 'e1', name: 'Town hall', edit, delete: remove }]]), create }, members: { me: { permissions: { has: () => true } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch', scheduledStartTime: '2030-01-01T00:00:00.000Z' })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').update({ name: 'Updated' })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').delete()).resolves.toMatchObject({ dryRun: true });
    expect(create).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  test('requires ManageEvents for event creation', async () => {
    const guild = {
      id: '1',
      scheduledEvents: { cache: new Map(), create: jest.fn() },
      members: { me: { permissions: { has: () => false } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch' }))
      .rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});
