import { describe, expect, jest, test } from '@jest/globals';
import { createMcpClientOptions, inspectMcpServer } from '../src/mcp/client.mjs';

describe('MCP client mode', () => {
  test('maps configured remote client settings', () => {
    expect(createMcpClientOptions({ client: { url: 'https://example.test/mcp', transport: 'https', token: 'secret', headers: { 'X-Agent': 'test' }, reconnect: false, reconnectBaseDelay: 10, reconnectMaxDelay: 20, maxReconnectAttempts: 2 } })).toEqual({ url: 'https://example.test/mcp', transport: 'https', token: 'secret', headers: { 'X-Agent': 'test' }, reconnect: false, reconnectBaseDelay: 10, reconnectMaxDelay: 20, maxReconnectAttempts: 2 });
  });

  test('inspects and closes a remote client', async () => {
    const client = { listTools: jest.fn(async () => ({ tools: ['run_discript'] })), listResources: jest.fn(async () => ({ resources: [] })), listPrompts: jest.fn(async () => ({ prompts: [] })), close: jest.fn(async () => {}) };
    const clientFactory = jest.fn(async () => client);
    await expect(inspectMcpServer({ client: { url: 'http://localhost/mcp', transport: 'http' } }, { clientFactory })).resolves.toEqual({ tools: { tools: ['run_discript'] }, resources: { resources: [] }, prompts: { prompts: [] } });
    expect(clientFactory).toHaveBeenCalled();
    expect(client.close).toHaveBeenCalled();
  });

  test('rejects unsupported profile stdio transport', () => {
    expect(() => createMcpClientOptions({ client: { transport: 'stdio' } })).toThrow('not yet available');
  });
});
