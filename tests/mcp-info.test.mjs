import { describe, expect, jest, test } from '@jest/globals';
import registerDiscriptInfo from '../src/mcp/tools/discript-info.mjs';

describe('MCP Discript information resources and prompts', () => {
  test('registers deterministic help resources, examples, and prompts', () => {
    const server = { registerResource: jest.fn(), registerPrompt: jest.fn() };
    registerDiscriptInfo({ mcpServer: server });
    expect(server.registerResource).toHaveBeenCalledTimes(5);
    expect(server.registerResource.mock.calls.map(call => call[1])).toEqual(['discript://help', 'discript://commands', 'discript://language', 'discript://safety', { uriTemplate: 'discript://examples/{name}', name: 'discript-example', description: 'A Discript example script by filename.' }]);
    expect(server.registerPrompt).toHaveBeenCalledTimes(6);
  });

  test('resource and prompt callbacks return MCP-shaped content', async () => {
    const server = { registerResource: jest.fn(), registerPrompt: jest.fn() };
    registerDiscriptInfo({ mcpServer: server });
    const help = await server.registerResource.mock.calls[0][3](new URL('discript://help'));
    expect(help.contents[0]).toMatchObject({ uri: 'discript://help', mimeType: 'text/markdown' });
    const prompt = server.registerPrompt.mock.calls[1][2]({ request: 'create a channel', guild: '123' });
    expect(prompt.messages[0].content.text).toContain('create a channel');
    expect(prompt.messages[0].content.text).toContain('123');
  });

  test('prompt families provide focused agent workflows', () => {
    const server = { registerResource: jest.fn(), registerPrompt: jest.fn() };
    registerDiscriptInfo({ mcpServer: server });
    const names = server.registerPrompt.mock.calls.map(call => call[0]);
    expect(names).toEqual(['inventory', 'safe-mutation', 'server-provisioning', 'rollback', 'debugging', 'script-generation']);
    for (const call of server.registerPrompt.mock.calls) {
      expect(call[1].description).toBeTruthy();
      expect(call[2]).toBeInstanceOf(Function);
    }
  });
});
