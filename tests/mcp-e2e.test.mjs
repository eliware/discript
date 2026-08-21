import { describe, expect, test } from '@jest/globals';
import { createServer } from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

  test('enforces bearer passthrough and advertises the configured CORS origin', async () => {
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp', auth: { mode: 'bearer-passthrough' },
      allowedOrigins: ['https://agent.example'],
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    try {
      const cors = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'OPTIONS', headers: { origin: 'https://agent.example' } });
      expect(cors.status).toBe(204);
      expect(cors.headers.get('access-control-allow-origin')).toBe('https://agent.example');
      const unauthorized = await fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }),
      });
      expect(unauthorized.status).toBe(401);
      const client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, token: 'passthrough-token', reconnect: false });
      try { expect((await client.listTools()).tools.map(tool => tool.name)).toContain('run_discript'); }
      finally { await client.close(); }
    } finally {
      await closeMcpServer(server);
    }
  }, 15000);

  test('discovers a Discript server over a stdio child process', async () => {
    const client = await mcpClient({
      transport: 'stdio', command: process.execPath,
      args: [fileURLToPath(new URL('../bin/discript.mjs', import.meta.url)), 'mcp', '--stdio'],
      reconnect: false,
    });
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain('run_discript');
      expect(client.getInstructions?.()).toContain('Discript is a Discord scripting runtime');
    } finally {
      await client.close();
    }
  }, 20000);

  test('discovers and executes through a separate HTTP server process', async () => {
    const probe = createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    const child = spawn(process.execPath, [fileURLToPath(new URL('../bin/discript.mjs', import.meta.url)), 'mcp'], {
      env: { ...process.env, DISCRIPT_MCP_PORT: String(port), DISCRIPT_MCP_AUTH_MODE: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let client;
    try {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
          const health = await fetch(`http://127.0.0.1:${port}/healthz`);
          if (health.ok) break;
        } catch { /* The child may still be starting. */ }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      client = await mcpClient({ url: `http://127.0.0.1:${port}/mcp`, reconnect: false });
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain('run_discript');
      const result = await client.callTool({ name: 'run_discript', arguments: { source: '1' } });
      expect(JSON.parse(result.content[0].text)).toMatchObject({ ok: true, exitCode: 0 });
    } finally {
      await client?.close();
      child.kill('SIGTERM');
      await new Promise(resolve => child.once('close', resolve));
    }
  }, 30000);

  test('discovers a Discript server over HTTPS with TLS files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-mcp-tls-'));
    const keyFile = join(directory, 'key.pem');
    const certFile = join(directory, 'cert.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyFile, '-out', certFile, '-subj', '/CN=localhost', '-days', '1'], { stdio: 'ignore' });
    const server = await mcpServer({
      httpPort: null, httpsPort: 0, endpointPath: '/mcp', tls: { keyFile, certFile }, auth: { mode: 'none' },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpsInstance.address().port;
    try {
      const response = await new Promise((resolve, reject) => {
        const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'https-test', version: '1' } } });
        const request = https.request(`https://localhost:${port}/mcp`, { method: 'POST', rejectUnauthorized: false, headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, response => {
          let text = ''; response.setEncoding('utf8'); response.on('data', chunk => { text += chunk; });
          response.on('end', () => resolve({ status: response.statusCode, body: text }));
        });
        request.on('error', reject); request.end(body);
      });
      expect(response.status).toBe(200);
      expect(response.body).toContain('Discript');
      await expect(new Promise((resolve, reject) => {
        const request = https.request(`https://localhost:${port}/mcp`, { method: 'POST', headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' } }, resolve);
        request.on('error', reject);
        request.end();
      })).rejects.toMatchObject({ code: expect.stringMatching(/SELF_SIGNED|CERT/) });
    } finally {
      await closeMcpServer(server);
      await rm(directory, { recursive: true, force: true });
    }
  }, 30000);

  test('returns protocol errors for malformed HTTP MCP requests', async () => {
    const server = await mcpServer({
      httpPort: 0, endpointPath: '/mcp', auth: { mode: 'none' },
      toolsDir: new URL('../src/mcp/tools/', import.meta.url).pathname,
      log: { debug() {}, info() {}, warn() {}, error() {} },
    });
    const port = server.httpInstance.address().port;
    try {
      const malformed = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' }, body: '{' });
      expect(malformed.status).toBe(406);
      expect(await malformed.json()).toMatchObject({ error: 'Invalid JSON' });
      const unsupported = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'GET', headers: { accept: 'application/json, text/event-stream' } });
      expect([404, 405]).toContain(unsupported.status);
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
