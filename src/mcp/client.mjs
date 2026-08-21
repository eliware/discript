import mcpClient from '@eliware/mcp-client';

export function createMcpClientOptions(config = {}) {
  const client = config.client ?? {};
  if (client.transport === 'stdio') {
    throw Object.assign(new Error('stdio MCP client transport is not yet available through the profile; use HTTP or SSE.'), { code: 'MCP_CLIENT_TRANSPORT_UNAVAILABLE', exitCode: 2 });
  }
  return {
    url: client.url,
    transport: client.transport,
    token: client.token ?? undefined,
    headers: client.headers,
    reconnect: client.reconnect,
    reconnectBaseDelay: client.reconnectBaseDelay,
    reconnectMaxDelay: client.reconnectMaxDelay,
    maxReconnectAttempts: client.maxReconnectAttempts ?? Infinity,
  };
}

export async function inspectMcpServer(config, { action = 'inspect', clientFactory = mcpClient } = {}) {
  const client = await clientFactory(createMcpClientOptions(config));
  try {
    if (action === 'tools') return { tools: await client.listTools() };
    if (action === 'resources') return { resources: await client.listResources() };
    if (action === 'prompts') return { prompts: await client.listPrompts() };
    if (action === 'inspect') {
      const [tools, resources, prompts] = await Promise.all([
        client.listTools(),
        client.listResources(),
        client.listPrompts(),
      ]);
      return { tools, resources, prompts };
    }
    throw Object.assign(new Error(`Unknown MCP client action: ${action}`), { code: 'INVALID_MCP_CLIENT_ACTION', exitCode: 2 });
  } finally {
    await client.close?.();
  }
}

export async function callMcpClient(config, { action, name, uri, arguments: rawArguments, clientFactory = mcpClient } = {}) {
  const client = await clientFactory(createMcpClientOptions(config));
  try {
    const argumentsValue = parseArguments(rawArguments);
    if (action === 'call') return { result: await client.callTool({ name, arguments: argumentsValue }) };
    if (action === 'read-resource') return { result: await client.readResource({ uri }) };
    if (action === 'get-prompt') return { result: await client.getPrompt({ name, arguments: argumentsValue }) };
    throw Object.assign(new Error(`Unknown MCP client action: ${action}`), { code: 'INVALID_MCP_CLIENT_ACTION', exitCode: 2 });
  } finally {
    await client.close?.();
  }
}

function parseArguments(value) {
  if (value === undefined || value === null || value === '') return {};
  try {
    const result = JSON.parse(value);
    if (!result || Array.isArray(result) || typeof result !== 'object') throw new Error('not an object');
    return result;
  } catch {
    throw Object.assign(new Error('--arguments must be a JSON object.'), { code: 'INVALID_MCP_ARGUMENTS', exitCode: 2 });
  }
}
