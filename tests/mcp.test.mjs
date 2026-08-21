import { describe, expect, jest, test } from '@jest/globals';

const executeInput = jest.fn(async (input, options) => ({ input, options }));
jest.unstable_mockModule('../src/cli/script.mjs', () => ({ executeInput }));

const { default: registerRunDiscript } = await import('../src/mcp/tools/run-discript.mjs');
const { closeMcpServer, createMcpServerOptions, startMcpServer } = await import('../src/mcp/server.mjs');

describe('MCP run_discript tool', () => {
  function registeredTool(context = {}) {
    const tool = {};
    const mcpServer = { context, tool: jest.fn((name, description, schema, handler) => Object.assign(tool, { name, description, schema, handler })) };
    registerRunDiscript({ mcpServer });
    return tool;
  }

  test('registers one compact execution tool and runs source through the engine', async () => {
    const tool = registeredTool();
    expect(tool.name).toBe('run_discript');
    expect(tool.description).toContain('dryRun=true');
    const result = await tool.handler({ source: 'guilds = []', dryRun: true, force: false, rest: true });
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toMatchObject({ ok: true, exitCode: 0 });
    expect(executeInput).toHaveBeenCalledWith(
      { kind: 'source', source: 'guilds = []', origin: 'mcp' },
      { dry_run: true, dryRun: true, yes: false, keep_alive: false, keepAlive: false, rest: true },
      { runtime: undefined, signal: expect.any(AbortSignal) },
    );
    expect(JSON.parse(result.content[0].text)).toMatchObject({ warnings: [], diagnostics: [] });
  });

  test('returns sanitized structured execution failures with exit codes', async () => {
    executeInput.mockRejectedValueOnce(Object.assign(new Error('missing access token'), {
      code: 'DISCORD_TOKEN_MISSING', exitCode: 4,
      details: { message: 'missing access token', token: 'must-not-leak' },
      warnings: ['check environment'], diagnostics: [{ phase: 'startup' }],
    }));
    const result = await registeredTool().handler({ source: 'guilds list' });
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(expect.objectContaining({
      ok: false,
      exitCode: 4,
      code: 'DISCORD_TOKEN_MISSING',
      error: 'missing access token',
      details: { message: 'missing access token' },
      warnings: ['check environment'],
      diagnostics: [{ phase: 'startup' }],
    }));
    expect(JSON.parse(result.content[0].text).requestId).toEqual(expect.any(String));
  });

  test('logs a correlated, sanitized execution outcome', async () => {
    const log = { debug: jest.fn(), info: jest.fn() };
    const result = await registeredTool({ mcpLog: log }).handler({ command: ['guilds', 'list'] });
    const payload = JSON.parse(result.content[0].text);
    expect(log.debug).toHaveBeenCalledWith(expect.objectContaining({ event: 'mcp.execution.started', requestId: payload.requestId, mode: 'command', dryRun: false, force: false }));
    expect(log.info).toHaveBeenCalledWith(expect.objectContaining({ event: 'mcp.execution.completed', requestId: payload.requestId, mode: 'command', ok: true, exitCode: 0, durationMs: expect.any(Number) }));
    expect(JSON.stringify(log.info.mock.calls)).not.toContain('DISCORD_TOKEN');
  });

  test('passes force approval and preview flags to both execution layers', async () => {
    const tool = registeredTool();
    await tool.handler({ command: ['roles', 'delete'], force: true, dryRun: false });
    expect(executeInput).toHaveBeenLastCalledWith(
      { kind: 'command', command: ['roles', 'delete'] },
      { dry_run: false, dryRun: false, yes: true, rest: true },
      { runtime: undefined, signal: expect.any(AbortSignal) },
    );
  });

  test('maps authenticated requests to read, write, and admin scopes', async () => {
    const tool = registeredTool();
    await tool.handler({ command: ['guilds', 'list'] }, { mcpAuth: { scopes: ['discord:read'] } });
    await expect(tool.handler({ command: ['messages', 'send'] }, { mcpAuth: { scopes: ['discord:read'] } })).rejects.toMatchObject({ code: 'MCP_SCOPE_REQUIRED', details: { scope: 'discord:write' } });
    await expect(tool.handler({ command: ['roles', 'delete'], force: true }, { mcpAuth: { scopes: ['discord:write'] } })).rejects.toMatchObject({ code: 'MCP_SCOPE_REQUIRED', details: { scope: 'discord:admin' } });
    await tool.handler({ command: ['roles', 'delete'], force: true }, { mcpAuth: { scopes: ['discord:admin'] } });
  });

  test('aborts an MCP execution when its timeout expires', async () => {
    let signal;
    executeInput.mockImplementationOnce(async (_input, _options, dependencies) => {
      signal = dependencies.signal;
      return new Promise(() => {});
    });
    const result = await registeredTool().handler({ source: 'sleep(1000)', timeout: 5 });
    expect(signal.aborted).toBe(true);
    expect(JSON.parse(result.content[0].text)).toMatchObject({ ok: false, code: 'EXECUTION_TIMEOUT', exitCode: 6 });
  });

  test('requires exactly one execution input', async () => {
    const tool = registeredTool();
    await expect(tool.handler({})).rejects.toMatchObject({ code: 'MCP_INPUT_REQUIRED', exitCode: 2 });
    await expect(tool.handler({ source: '1', command: ['guilds', 'list'] })).rejects.toMatchObject({ code: 'MCP_INPUT_REQUIRED', exitCode: 2 });
  });
});

describe('MCP server profile mapping', () => {
  test('maps HTTP static-auth profile settings', () => {
    const options = createMcpServerOptions({ token: 'discord', mcp: {
      transport: 'http', port: 9000, endpoint: '/api/mcp', authMode: 'static', authToken: 'mcp-secret',
      allowedOrigins: ['https://agent.example'], httpRedirect: false,
    } });
    expect(options).toMatchObject({ httpPort: 9000, httpsPort: undefined, endpointPath: '/api/mcp', auth: { mode: 'static', token: 'mcp-secret' }, allowedOrigins: ['https://agent.example'] });
    expect(options.context.token).toBe('discord');
  });

  test('maps HTTPS TLS profile settings and disables HTTP', () => {
    const options = createMcpServerOptions({ mcp: {
      transport: 'https', port: 9443, tlsKeyFile: '/run/key.pem', tlsCertFile: '/run/cert.pem', tlsCaFile: '/run/ca.pem', authMode: 'bearer-passthrough',
    } });
    expect(options).toMatchObject({ httpPort: null, httpsPort: 9443, tls: { keyFile: '/run/key.pem', certFile: '/run/cert.pem', caFile: '/run/ca.pem' }, auth: { mode: 'bearer-passthrough' } });
  });

  test('maps inline TLS profile settings', () => {
    expect(createMcpServerOptions({ mcp: { transport: 'https', port: 9443, tlsKey: 'key', tlsCert: 'cert', tlsCa: 'ca' } }).tls).toEqual({ key: 'key', cert: 'cert', ca: 'ca' });
  });

  test('maps separate HTTP and HTTPS listeners for redirects', () => {
    const options = createMcpServerOptions({ mcp: {
      transport: 'http', port: 8765, httpPort: 8080, httpsPort: 8443,
      httpRedirect: true, tlsKeyFile: '/run/key.pem', tlsCertFile: '/run/cert.pem',
    } });
    expect(options).toMatchObject({ httpPort: 8080, httpsPort: 8443, httpRedirect: true });
  });

  test('stdio disables network listeners regardless of profile transport', () => {
    expect(createMcpServerOptions({ mcp: { transport: 'https', port: 9443 } }, { stdio: true })).toMatchObject({ stdio: true, httpPort: null, httpsPort: undefined });
  });

  test('maps OAuth2 introspection profile settings', () => {
    const options = createMcpServerOptions({ mcp: { authMode: 'oauth2', oauthIssuer: 'https://auth', oauthResource: 'https://resource', oauthRequiredScopes: ['discord:read'], oauthIntrospectionEndpoint: 'https://auth/introspect', oauthClientId: 'client', oauthClientSecret: 'secret' } });
    expect(options.auth).toMatchObject({ mode: 'oauth2', issuer: 'https://auth', resource: 'https://resource', requiredScopes: ['discord:read'], introspection: { introspectionEndpoint: 'https://auth/introspect', clientId: 'client', clientSecret: 'secret' } });
  });

  test('maps MCP execution safety limits into server context', () => {
    const options = createMcpServerOptions({ mcp: { executionTimeout: 1000, maxConcurrent: 2, maxOutputBytes: 4096 } });
    expect(options.context.mcpLimits.timeout).toBe(1000);
    expect(options.context.mcpLimits.maxOutputBytes).toBe(4096);
    expect(options.context.mcpLimits.limiter.limit).toBe(2);
    expect(options.context.mcpLimits.limiter.maxPending).toBe(32);
  });

  test('coordinates repeated and concurrent MCP shutdown calls', async () => {
    const server = await startMcpServer({ config: { mcp: { authMode: 'none' } }, httpPort: 0 });
    await Promise.all([closeMcpServer(server), closeMcpServer(server), closeMcpServer(server)]);
    await closeMcpServer(server);
  });
});
