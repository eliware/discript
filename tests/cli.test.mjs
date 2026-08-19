import { describe, expect, jest, test } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.mjs';
import { createDiscordApi } from '../src/discord.mjs';

describe('CLI execution', () => {
  test('returns help without connecting', async () => {
    const output = [];
    await run(['--help'], { stdout: value => output.push(value) });
    expect(output[0]).toContain('Usage: discript');
  });

  test('rejects invalid timeouts', async () => {
    await expect(run(['--timeout', '0', '--eval', '1'])).rejects.toMatchObject({ code: 'INVALID_TIMEOUT' });
  });
});


describe('capability lookup', () => {
  test('returns normalized guild and channel values', () => {
    const channel = { id: '2', name: 'general', type: 0 };
    const guild = { id: '1', name: 'test', channels: { cache: new Map([['2', channel]]) } };
    const api = createDiscordApi({
      channels: { cache: new Map([['2', channel]]) },
      guilds: { cache: new Map([['1', guild]]) },
    });
    expect(api.guilds.get('1').name).toBe('test');
    expect(api.channels.get('2')).toMatchObject({ id: '2', name: 'general' });
  });
});


describe('direct dry-run validation', () => {
  test('validates required mutation targets without connecting', async () => {
    const output = [];
    await expect(run(['channels', 'create', '--dry-run', '--guild', '123', '--name', 'preview', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } })).resolves.toMatchObject({ dryRun: true, action: 'channels.create' });
    expect(output[0]).toContain('"dryRun": true');
  });

  test('reports missing fields in dry-run mode', async () => {
    await expect(run(['messages', 'delete', '--dry-run', '--channel', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'MESSAGE_REQUIRED', exitCode: 2 });
  });

  test('validates emoji and sticker mutation fields in dry-run mode', async () => {
    await expect(run(['emojis', 'create', '--dry-run', '--guild', '123', '--name', 'wave'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'FILE_REQUIRED', exitCode: 2 });
    await expect(run(['stickers', 'create', '--dry-run', '--guild', '123', '--name', 'wave', '--file', '/tmp/wave.png'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'TAGS_REQUIRED', exitCode: 2 });
  });

  test('validates webhook mutation fields in dry-run mode', async () => {
    await expect(run(['webhooks', 'create', '--dry-run', '--channel', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'NAME_REQUIRED', exitCode: 2 });
    await expect(run(['webhooks', 'delete', '--dry-run', '--channel', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'WEBHOOK_REQUIRED', exitCode: 2 });
  });

  test('validates permission overwrite fields in dry-run mode', async () => {
    await expect(run(['permissions', 'set', '--dry-run', '--channel', '123', '--target', '456'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'PERMISSIONS_REQUIRED', exitCode: 2 });
    await expect(run(['permissions', 'delete', '--dry-run', '--channel', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'TARGET_REQUIRED', exitCode: 2 });
  });

  test('validates voice-user command targets in dry-run mode', async () => {
    await expect(run(['voice-users', 'mute', '--dry-run', '--guild', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'USER_REQUIRED', exitCode: 2 });
    await expect(run(['voice-users', 'move', '--dry-run', '--guild', '123', '--user', '456'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'CHANNEL_REQUIRED', exitCode: 2 });
    await expect(run(['voice-users', 'unmute', '--dry-run', '--guild', '123'], { stdout: () => {}, stdin: { isTTY: true } })).rejects.toMatchObject({ code: 'USER_REQUIRED', exitCode: 2 });
  });
});


const binary = fileURLToPath(new URL('../bin/discript.mjs', import.meta.url));

describe('process contract', () => {
  test('returns zero and help on stdout', () => {
    const output = execFileSync(process.execPath, [binary, '--help'], { encoding: 'utf8' });
    expect(output).toContain('Usage: discript');
  });

  test('returns stable invalid-input status and JSON error on stderr', () => {
    let error;
    try {
      execFileSync(process.execPath, [binary, '-z', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (caught) {
      error = caught;
    }
    expect(error.status).toBe(2);
    expect(JSON.parse(error.stderr)).toMatchObject({ code: 'INVALID_OPTION' });
    expect(error.stdout).toBe('');
  });
});


describe('channel mutations', () => {
  test('creates channels only with approval', async () => {
    const create = jest.fn(async settings => ({ id: '2', name: settings.name, type: settings.type }));
    const api = createDiscordApi({ guilds: { cache: new Map([['1', { id: '1', name: 'test', channels: { cache: new Map(), create } }]]) } }, { yes: true });
    await expect(api.guilds.get('1').channels.create('temporary')).resolves.toEqual({ id: '2', name: 'temporary', type: 0 });
    expect(create).toHaveBeenCalledWith({ name: 'temporary', type: 0 });
  });

  test('previews channel creation', async () => {
    const create = jest.fn();
    const api = createDiscordApi({ guilds: { cache: new Map([['1', { id: '1', name: 'test', channels: { cache: new Map(), create } }]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').channels.create('temporary')).resolves.toEqual({ dryRun: true, guildId: '1', name: 'temporary', type: 0 });
    expect(create).not.toHaveBeenCalled();
  });
});
