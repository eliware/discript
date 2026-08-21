import { afterEach, describe, expect, jest, test } from '@jest/globals';

const brokerRequest = jest.fn();
jest.unstable_mockModule('../../src/broker.mjs', () => ({
  brokerRequest,
  startGatewayBroker: jest.fn(),
}));

const { run } = await import('../../src/cli.mjs');

const original = {
  token: process.env.DISCORD_TOKEN,
  mode: process.env.DISCRIPT_CONNECTION_MODE,
};

afterEach(() => {
  brokerRequest.mockReset();
  if (original.token === undefined) delete process.env.DISCORD_TOKEN; else process.env.DISCORD_TOKEN = original.token;
  if (original.mode === undefined) delete process.env.DISCRIPT_CONNECTION_MODE; else process.env.DISCRIPT_CONNECTION_MODE = original.mode;
});

describe('broker output formatting', () => {
  test('formats broker command results as JSON', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    process.env.DISCRIPT_CONNECTION_MODE = 'daemon';
    brokerRequest.mockResolvedValue({ ok: true, value: [{ id: '1', name: 'general' }] });
    const output = [];

    await run(['guilds', 'list', '--json'], { stdout: value => output.push(value), stdin: { isTTY: true } });

    expect(output).toEqual(['[\n  {\n    "id": "1",\n    "name": "general"\n  }\n]']);
  });

  test('formats broker script results as JSONL', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    process.env.DISCRIPT_CONNECTION_MODE = 'daemon';
    brokerRequest.mockResolvedValue({ ok: true, value: { complete: true } });
    const output = [];

    await run(['--eval', '1', '--output', 'jsonl'], { stdout: value => output.push(value), stdin: { isTTY: true } });

    expect(output).toEqual(['{"complete":true}']);
  });
});
