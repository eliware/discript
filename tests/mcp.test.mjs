import { describe, expect, jest, test } from '@jest/globals';

const executeInput = jest.fn(async (input, options) => ({ input, options }));
jest.unstable_mockModule('../src/cli/script.mjs', () => ({ executeInput }));

const { default: registerRunDiscript } = await import('../src/mcp/tools/run-discript.mjs');
const { createMcpServerOptions } = await import('../src/mcp/server.mjs');

describe('MCP run_discript tool', () => {
  function registeredTool() {
    const tool = {};
    const mcpServer = { tool: jest.fn((name, description, schema, handler) => Object.assign(tool, { name, description, schema, handler })) };
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
      { dry_run: true, yes: false, rest: true },
      { runtime: undefined },
    );
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

  test('stdio disables network listeners regardless of profile transport', () => {
    expect(createMcpServerOptions({ mcp: { transport: 'https', port: 9443 } }, { stdio: true })).toMatchObject({ stdio: true, httpPort: null, httpsPort: undefined });
  });
});
