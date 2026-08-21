import { expect, jest, test } from '@jest/globals';

process.env.DISCORD_TOKEN = 'test-token';
process.env.DISCRIPT_CONNECTION_MODE = 'daemon';
process.env.DISCRIPT_DAEMON_MODE = 'hybrid';
process.env.DISCRIPT_MCP_PORT = '8765';

const setOnClose = jest.fn();
const startGatewayBroker = jest.fn(async () => ({ endpoint: '/tmp/hybrid.sock', runtime: {}, setOnClose, close: jest.fn() }));
const brokerRequest = jest.fn(async () => ({ ok: true, ready: true }));
jest.unstable_mockModule('../../src/broker.mjs', () => ({ startGatewayBroker, brokerRequest }));
const startMcpServer = jest.fn(async () => ({ transport: 'http' }));
const closeMcpServer = jest.fn();
jest.unstable_mockModule('../../src/mcp/server.mjs', () => ({ startMcpServer, closeMcpServer }));

const { run } = await import('../../src/cli.mjs');

test('hybrid daemon starts the local broker and MCP server on the same runtime', async () => {
  const stdout = jest.fn();
  await run(['daemon', 'start'], { stdout });
  expect(startGatewayBroker).toHaveBeenCalledWith(expect.objectContaining({ token: 'test-token' }));
  expect(startMcpServer).toHaveBeenCalledWith(expect.objectContaining({ httpPort: 8765, context: { runtime: {} } }));
  expect(setOnClose).toHaveBeenCalled();
  expect(stdout).toHaveBeenCalledWith({ started: true, endpoint: '/tmp/hybrid.sock', mcpPort: 8765 });
});
