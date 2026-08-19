import { run } from '../src/cli.mjs';

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
