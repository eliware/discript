import { describe, expect, jest, test } from '@jest/globals';
import { callMcpClient, createMcpClientOptions, inspectMcpServer } from '../src/mcp/client.mjs';

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

  test('invokes tools, reads resources, and retrieves prompts', async () => {
    const client = { callTool: jest.fn(async input => input), readResource: jest.fn(async input => input), getPrompt: jest.fn(async input => input), close: jest.fn(async () => {}) };
    const clientFactory = jest.fn(async () => client);
    await expect(callMcpClient({ client: { url: 'http://localhost/mcp' } }, { action: 'call', name: 'run_discript', arguments: '{"source":"guilds list"}', clientFactory })).resolves.toEqual({ result: { name: 'run_discript', arguments: { source: 'guilds list' } } });
    await expect(callMcpClient({ client: { url: 'http://localhost/mcp' } }, { action: 'read-resource', uri: 'discript://help', clientFactory })).resolves.toEqual({ result: { uri: 'discript://help' } });
    await expect(callMcpClient({ client: { url: 'http://localhost/mcp' } }, { action: 'get-prompt', name: 'safe-mutation', arguments: '{"guild":"123"}', clientFactory })).resolves.toEqual({ result: { name: 'safe-mutation', arguments: { guild: '123' } } });
    expect(client.close).toHaveBeenCalledTimes(3);
    await expect(callMcpClient({ client: { url: 'http://localhost/mcp' } }, { action: 'call', name: 'x', arguments: 'bad', clientFactory })).rejects.toThrow('--arguments must be a JSON object');
  });
});
