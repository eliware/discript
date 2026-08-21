import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mcpServer } from '@eliware/mcp-server';

const toolsDir = join(dirname(fileURLToPath(import.meta.url)), 'tools');

export function createMcpServerOptions(config = {}, { stdio = false, port, transport, token, context = {}, ...options } = {}) {
  const mcp = config.mcp ?? {};
  const selectedTransport = transport ?? mcp.transport ?? 'http';
  const selectedPort = port ?? mcp.port ?? 8765;
  const configuredHttpPort = mcp.httpPort ?? (selectedTransport === 'https' ? null : selectedPort);
  const configuredHttpsPort = mcp.httpsPort ?? (selectedTransport === 'https' ? selectedPort : null);
  const authMode = mcp.authMode ?? 'none';
  const auth = authMode === 'none'
    ? { mode: 'none' }
    : {
      mode: authMode,
      ...(mcp.authToken ? { token: mcp.authToken } : {}),
      ...(authMode === 'oauth2' ? {
        issuer: mcp.oauthIssuer,
        resource: mcp.oauthResource,
        requiredScopes: mcp.oauthRequiredScopes ?? [],
        introspection: { introspectionEndpoint: mcp.oauthIntrospectionEndpoint, clientId: mcp.oauthClientId, clientSecret: mcp.oauthClientSecret },
      } : {}),
    };
  const tls = {
    ...(mcp.tlsKeyFile ? { keyFile: mcp.tlsKeyFile } : {}),
    ...(mcp.tlsCertFile ? { certFile: mcp.tlsCertFile } : {}),
    ...(mcp.tlsCaFile ? { caFile: mcp.tlsCaFile } : {}),
  };
  return {
    ...options,
    ...(stdio ? { httpPort: null, httpsPort: undefined } : {
      httpPort: configuredHttpPort,
      httpsPort: configuredHttpsPort ?? undefined,
    }),
    endpointPath: mcp.endpoint ?? '/mcp',
    auth,
    tls,
    httpRedirect: Boolean(mcp.httpRedirect),
    allowedOrigins: mcp.allowedOrigins ?? [],
    context: { token: token ?? config.token ?? null, ...context },
    stdio,
  };
}

export async function startMcpServer({ config = {}, stdio = false, httpPort, transport, token, context = {}, ...options } = {}) {
  return mcpServer({
    ...createMcpServerOptions(config, { ...options, stdio, port: httpPort, transport, token, context }),
    toolsDir,
  });
}

export async function closeMcpServer(server) {
  await server?.transport?.close?.();
  await Promise.all([
    closeHttpInstance(server?.httpInstance),
    closeHttpInstance(server?.httpsInstance),
  ]);
}

function closeHttpInstance(instance) {
  if (!instance) return Promise.resolve();
  return new Promise(resolve => instance.close(() => resolve()));
}
