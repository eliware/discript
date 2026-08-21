import { describe, expect, jest, test } from '@jest/globals';
import { callMcpClient, createMcpClientOptions, inspectMcpServer, runRemoteDiscript } from '../src/mcp/client.mjs';

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

  test('maps configured stdio child-process transport', () => {
    expect(createMcpClientOptions({ client: { transport: 'stdio', command: 'discript', args: ['mcp', '--stdio'] } })).toMatchObject({ transport: 'stdio', command: 'discript', args: ['mcp', '--stdio'] });
  });

  test('passes programmatic async token providers through to the MCP client', () => {
    const tokenProvider = async () => 'rotated-token';
    expect(createMcpClientOptions({ client: { url: 'https://example.test/mcp', tokenProvider } }).tokenProvider).toBe(tokenProvider);
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

  test('runs source remotely and preserves structured results', async () => {
    const client = { listTools: jest.fn(async () => ({ tools: [{ name: 'run_discript' }] })), listResources: jest.fn(async () => ({ resources: [] })), listPrompts: jest.fn(async () => ({ prompts: [] })), getInstructions: jest.fn(() => 'help'), callTool: jest.fn(async input => ({ structuredContent: { ok: true, exitCode: 0, value: input.arguments } })), close: jest.fn(async () => {}) };
    await expect(runRemoteDiscript({ client: { url: 'http://localhost/mcp' } }, { source: 'guilds list', dryRun: true, clientFactory: async () => client })).resolves.toEqual({ ok: true, exitCode: 0, value: { source: 'guilds list', dryRun: true, force: false, rest: false } });
    expect(client.listTools).toHaveBeenCalled();
  });

  test('normalizes standard MCP text tool results', async () => {
    const client = { listTools: jest.fn(async () => ({ tools: [{ name: 'run_discript' }] })), callTool: jest.fn(async () => ({ content: [{ type: 'text', text: JSON.stringify({ ok: true, requestId: 'request-1', exitCode: 0, value: { guilds: [] }, warnings: [], diagnostics: [] }) }] })), close: jest.fn(async () => {}) };
    await expect(runRemoteDiscript({ client: { url: 'http://localhost/mcp' } }, { command: ['guilds', 'list'], clientFactory: async () => client })).resolves.toEqual({ ok: true, requestId: 'request-1', exitCode: 0, value: { guilds: [] }, warnings: [], diagnostics: [] });
  });

  test('preserves remote failures and exit codes', async () => {
    const client = { listTools: jest.fn(async () => ({ tools: [{ name: 'run_discript' }] })), callTool: jest.fn(async () => ({ isError: true, structuredContent: { ok: false, code: 'MISSING_PERMISSION', exitCode: 5, error: 'Denied' } })), close: jest.fn(async () => {}) };
    await expect(runRemoteDiscript({ client: { url: 'http://localhost/mcp' } }, { command: ['roles', 'delete'], clientFactory: async () => client })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5, message: 'Denied' });
  });

  test('fails before execution when the remote lacks run_discript', async () => {
    const client = { listTools: jest.fn(async () => ({ tools: [{ name: 'other_tool' }] })), callTool: jest.fn(), close: jest.fn(async () => {}) };
    await expect(runRemoteDiscript({ client: { url: 'http://localhost/mcp' } }, { command: ['guilds', 'list'], clientFactory: async () => client })).rejects.toMatchObject({ code: 'REMOTE_TOOL_UNAVAILABLE', exitCode: 1 });
    expect(client.callTool).not.toHaveBeenCalled();
  });

  test('enforces request timeout and output limit', async () => {
    const slow = { listTools: jest.fn(() => new Promise(() => {})), close: jest.fn(async () => {}) };
    await expect(inspectMcpServer({ client: { url: 'http://localhost/mcp', timeout: 5 } }, { action: 'tools', clientFactory: async () => slow })).rejects.toMatchObject({ code: 'MCP_CLIENT_TIMEOUT', exitCode: 124 });
    const large = { listTools: jest.fn(async () => ({ tools: ['x'.repeat(100) ] })), close: jest.fn(async () => {}) };
    await expect(inspectMcpServer({ client: { url: 'http://localhost/mcp', timeout: 100, maxOutputBytes: 20 } }, { action: 'tools', clientFactory: async () => large })).rejects.toMatchObject({ code: 'MCP_OUTPUT_LIMIT' });
  });
});
