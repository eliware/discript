import { describe, expect, jest, test } from '@jest/globals';

const runRemoteDiscript = jest.fn(async (_config, input) => ({ ok: true, exitCode: 0, value: input }));
jest.unstable_mockModule('../../src/mcp/client.mjs', () => ({ runRemoteDiscript }));

const { run } = await import('../../src/cli.mjs');

describe('configured MCP client CLI mode', () => {
  const original = { mode: process.env.DISCRIPT_CONNECTION_MODE, url: process.env.DISCRIPT_CLIENT_URL };

  test('routes ordinary commands through the configured remote client', async () => {
    process.env.DISCRIPT_CONNECTION_MODE = 'mcp-client';
    process.env.DISCRIPT_CLIENT_URL = 'http://localhost/mcp';
    const stdout = jest.fn();
    await run(['guilds', 'list'], { stdout });
    expect(runRemoteDiscript).toHaveBeenCalledWith(expect.objectContaining({ connectionMode: 'mcp-client' }), expect.objectContaining({ command: ['guilds', 'list'] }));
    expect(stdout).toHaveBeenCalled();
  });

  test('preserves direct override', async () => {
    process.env.DISCRIPT_CONNECTION_MODE = 'mcp-client';
    process.env.DISCRIPT_CLIENT_URL = 'http://localhost/mcp';
    await expect(run(['--direct', '--eval', '1'])).resolves.toBe(1);
    expect(runRemoteDiscript).toHaveBeenCalledTimes(1);
  });

  afterAll(() => {
    if (original.mode === undefined) delete process.env.DISCRIPT_CONNECTION_MODE; else process.env.DISCRIPT_CONNECTION_MODE = original.mode;
    if (original.url === undefined) delete process.env.DISCRIPT_CLIENT_URL; else process.env.DISCRIPT_CLIENT_URL = original.url;
  });
});
