import { describe, expect, test } from '@jest/globals';
import { mcpServer } from '@eliware/mcp-server';
import mcpClient from '@eliware/mcp-client';
import { closeMcpServer } from '../src/mcp/server.mjs';

describe('MCP server/client HTTP integration', () => {
  test('discovers help and executes a dry-run through the real transport', async () => {
    const server = await mcpServer({
      httpPort: 0,
      endpointPath: '/mcp',
      auth: { mode: 'none' },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    const client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, reconnect: false });
    try {
      const tools = await client.listTools();
      const resources = await client.listResources();
      const prompts = await client.listPrompts();
      expect(tools.tools.map(tool => tool.name)).toContain('run_discript');
      expect(resources.resources.map(resource => resource.uri)).toContain('discript://help');
      expect(prompts.prompts.map(prompt => prompt.name)).toContain('safe-mutation');
      const help = await client.readResource({ uri: 'discript://help' });
      expect(help.contents[0].text).toContain('run_discript');
      const catalog = await client.readResource({ uri: 'discript://commands' });
      expect(JSON.parse(catalog.contents[0].text)).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'guilds list' })]));
      const example = await client.readResource({ uri: 'discript://examples/list-guilds' });
      expect(example.contents[0].text).toContain('guilds');
      const result = await client.callTool({ name: 'run_discript', arguments: { source: '1', dryRun: true } });
      expect(JSON.parse(result.content[0].text)).toMatchObject({ ok: true, exitCode: 0, value: { dryRun: true } });
    } finally {
      await client.close();
      await closeMcpServer(server);
    }
  }, 15000);
});
