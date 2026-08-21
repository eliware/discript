import { describe, expect, test } from '@jest/globals';
import { createServer } from 'node:http';
import { mcpServer } from '@eliware/mcp-server';
import mcpClient from '@eliware/mcp-client';
import { closeMcpServer, startMcpServer } from '../src/mcp/server.mjs';

describe('MCP server/client HTTP integration', () => {
  test('discovers help and executes a dry-run through the real transport', async () => {
    const server = await startMcpServer({ config: { mcp: { authMode: 'none' } }, httpPort: 0 });
    const port = server.httpInstance.address().port;
    const client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, reconnect: false });
    try {
      const health = await fetch(`http://127.0.0.1:${port}/healthz`);
      expect(health.status).toBe(200);
      expect(await health.json()).toMatchObject({ ok: true, service: 'discript-mcp', ready: true });
      expect(client.getInstructions?.()).toContain('Discript is a Discord scripting runtime');
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

  test('accepts a configured static bearer token', async () => {
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp', auth: { mode: 'static', token: 'integration-secret' },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    const client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, token: 'integration-secret', reconnect: false });
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain('run_discript');
    } finally {
      await client.close();
      await closeMcpServer(server);
    }
  }, 15000);

  test('rejects missing and invalid static bearer tokens', async () => {
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp', auth: { mode: 'static', token: 'integration-secret' },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    try {
      for (const headers of [{}, { authorization: 'Bearer wrong-token' }]) {
        const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'POST', headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }),
        });
        expect(response.status).toBe(401);
      }
    } finally {
      await closeMcpServer(server);
    }
  }, 15000);

  test('accepts an OAuth2 token validated by a local introspection service', async () => {
    const introspection = createServer((request, response) => {
      if (request.method !== 'POST' || request.url !== '/introspect') {
        response.writeHead(404).end();
        return;
      }
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {
        expect(request.headers.authorization).toBe(`Basic ${Buffer.from('client:secret').toString('base64')}`);
        expect(new URLSearchParams(body).get('token')).toBe('oauth-integration-token');
        expect(new URLSearchParams(body).get('resource')).toBe('http://127.0.0.1/mcp');
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({
          active: true,
          iss: 'http://127.0.0.1/issuer',
          aud: ['http://127.0.0.1/mcp'],
          exp: Math.floor(Date.now() / 1000) + 300,
          token_type: 'Bearer',
          sub: 'integration-agent',
          scope: 'discord:read discord:write',
          secret_claim: 'must-not-be-forwarded',
        }));
      });
    });
    await new Promise(resolve => introspection.listen(0, '127.0.0.1', resolve));
    const introspectionPort = introspection.address().port;
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp',
      auth: {
        mode: 'oauth2', issuer: 'http://127.0.0.1/issuer', resource: 'http://127.0.0.1/mcp',
        requiredScopes: ['discord:read'],
        introspection: {
          introspectionEndpoint: `http://127.0.0.1:${introspectionPort}/introspect`,
          clientId: 'client', clientSecret: 'secret',
        },
      },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    const client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, token: 'oauth-integration-token', reconnect: false });
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain('run_discript');
      const metadata = await fetch(`http://127.0.0.1:${port}/.well-known/oauth-protected-resource/mcp`);
      expect(metadata.status).toBe(200);
      expect(await metadata.json()).toMatchObject({ resource: 'http://127.0.0.1/mcp' });
    } finally {
      await client.close();
      await closeMcpServer(server);
      await new Promise(resolve => introspection.close(resolve));
    }
  }, 15000);

  test('rejects an OAuth2 token when introspection marks it inactive', async () => {
    const introspection = createServer((_request, response) => {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ active: false }));
    });
    await new Promise(resolve => introspection.listen(0, '127.0.0.1', resolve));
    const introspectionPort = introspection.address().port;
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp',
      auth: {
        mode: 'oauth2', issuer: 'http://127.0.0.1/issuer', resource: 'http://127.0.0.1/mcp',
        introspection: { introspectionEndpoint: `http://127.0.0.1:${introspectionPort}/introspect` },
      },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST', headers: { authorization: 'Bearer inactive-token', 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }),
      });
      expect(response.status).toBe(401);
    } finally {
      await closeMcpServer(server);
      await new Promise(resolve => introspection.close(resolve));
    }
  }, 15000);
});
