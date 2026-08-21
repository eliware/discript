import mcpClient from '@eliware/mcp-client';

export function createMcpClientOptions(config = {}) {
  const client = config.client ?? {};
  return {
    url: client.url,
    transport: client.transport,
    token: client.token ?? undefined,
    headers: client.headers,
    command: client.command ?? undefined,
    args: client.args,
    reconnect: client.reconnect,
    reconnectBaseDelay: client.reconnectBaseDelay,
    reconnectMaxDelay: client.reconnectMaxDelay,
    maxReconnectAttempts: client.maxReconnectAttempts ?? Infinity,
    timeout: client.timeout,
  };
}

export async function inspectMcpServer(config, { action = 'inspect', clientFactory = mcpClient } = {}) {
  const client = await clientFactory(createMcpClientOptions(config));
  try {
    if (action === 'tools') return bounded(config, { tools: await requestWithLimits(client.listTools(), config) });
    if (action === 'resources') return bounded(config, { resources: await requestWithLimits(client.listResources(), config) });
    if (action === 'prompts') return bounded(config, { prompts: await requestWithLimits(client.listPrompts(), config) });
    if (action === 'inspect') {
      const [tools, resources, prompts] = await Promise.all([
        requestWithLimits(client.listTools(), config),
        requestWithLimits(client.listResources(), config),
        requestWithLimits(client.listPrompts(), config),
      ]);
      return bounded(config, { tools, resources, prompts });
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
    if (action === 'call') return bounded(config, { result: await requestWithLimits(client.callTool({ name, arguments: argumentsValue }), config) });
    if (action === 'read-resource') return bounded(config, { result: await requestWithLimits(client.readResource({ uri }), config) });
    if (action === 'get-prompt') return bounded(config, { result: await requestWithLimits(client.getPrompt({ name, arguments: argumentsValue }), config) });
    throw Object.assign(new Error(`Unknown MCP client action: ${action}`), { code: 'INVALID_MCP_CLIENT_ACTION', exitCode: 2 });
  } finally {
    await client.close?.();
  }
}

export async function runRemoteDiscript(config, { source, command, dryRun = false, force = false, timeout, rest = false, clientFactory = mcpClient } = {}) {
  const client = await clientFactory(createMcpClientOptions(config));
  try {
    const response = await requestWithLimits(client.callTool({ name: 'run_discript', arguments: {
      ...(source !== undefined ? { source } : { command }), dryRun, force,
      ...(timeout !== undefined ? { timeout } : {}), rest,
    } }), config, timeout);
    return bounded(config, normalizeRemoteResponse(response));
  } finally { await client.close?.(); }
}

function normalizeRemoteResponse(response) {
  const payload = response?.structuredContent ?? response;
  if (response?.isError || payload?.ok === false) {
    throw Object.assign(new Error(payload?.error ?? 'Remote Discript execution failed.'), {
      code: payload?.code ?? 'REMOTE_DISCRIPT_ERROR', exitCode: payload?.exitCode ?? 1, details: payload?.details,
    });
  }
  return payload?.ok === true && 'value' in payload ? payload : { ok: true, exitCode: 0, value: payload };
}

function requestWithLimits(promise, config, timeout = config.client?.timeout) {
  const duration = Number(timeout);
  if (!Number.isFinite(duration) || duration <= 0) return promise;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`MCP request timed out after ${duration}ms.`), { code: 'MCP_CLIENT_TIMEOUT', exitCode: 124 })), duration);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

function bounded(config, value) {
  const limit = Number(config.client?.maxOutputBytes);
  if (Number.isFinite(limit) && Buffer.byteLength(JSON.stringify(value)) > limit) {
    throw Object.assign(new Error(`MCP response exceeded the ${limit}-byte output limit.`), { code: 'MCP_OUTPUT_LIMIT', exitCode: 1 });
  }
  return value;
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
