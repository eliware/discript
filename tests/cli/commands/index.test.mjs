import { describe, expect, jest, test } from '@jest/globals';
import { executeDirectCommand } from '../../../src/cli/commands/index.mjs';

describe('command dispatcher', () => { test('handles catalog commands without connecting', async () => expect(executeDirectCommand(['commands', 'list'], {})).resolves.toEqual(expect.any(Array))); });

describe('command dispatcher boundaries', () => {
  test('returns a dry-run preview before creating a runtime', async () => {
    const runtime = { client: {}, shutdown: jest.fn() };
    await expect(executeDirectCommand(['channels', 'create'], { dry_run: true, guild: '1', name: 'preview' }, { runtime })).resolves.toMatchObject({ dryRun: true });
    expect(runtime.shutdown).not.toHaveBeenCalled();
  });

  test('reports unknown commands with suggestions and always cleans owned runtimes', async () => {
    const shutdown = jest.fn();
    await expect(executeDirectCommand(['guilds', 'lst'], {}, { runtime: { client: {}, shutdown } })).rejects.toMatchObject({ code: 'UNKNOWN_COMMAND', details: { suggestions: expect.any(Array) } });
    expect(shutdown).not.toHaveBeenCalled();
  });

  test('returns a guild list from an injected runtime', async () => {
    const channel = { id: '10', name: 'general', type: 0 };
    const channels = new Map([['10', channel]]); channels.map = callback => [...channels.values()].map(callback);
    const guild = { id: '1', name: 'Test Guild', channels: { cache: channels } };
    const runtime = { client: { guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) } }, shutdown: jest.fn() };
    await expect(executeDirectCommand(['channels', 'list'], { guild: '1' }, { runtime })).resolves.toEqual([{ id: '10', name: 'general', type: 0 }]);
    expect(runtime.shutdown).not.toHaveBeenCalled();
  });
});
