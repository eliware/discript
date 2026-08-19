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
});
