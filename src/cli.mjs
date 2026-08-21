import dotenv from 'dotenv';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Load the project-local file first, then the user-level fallback. dotenv does
// not overwrite existing values, so shell exports and local configuration win.
dotenv.config({ quiet: true });
dotenv.config({ path: join(homedir(), '.discript.env'), quiet: true });


import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';




import { withTimeout, validateTimeout } from "./cli/lifecycle.mjs";
import { executeInput } from './cli/script.mjs';
import { brokerRequest, startGatewayBroker } from './broker.mjs';
import { loadConfig, redactedConfig, validateConfig } from './config.mjs';
import { withGatewayRetry } from './gateway-retry.mjs';

export async function run(argv = [], dependencies = {}) {
  const { stdout = console.log, stdin = process.stdin } = dependencies;
  const { positionals, options } = parseArgs(argv);
  if (options.help) return stdout(helpText());
  if (options.version) return stdout(VERSION);
  if (positionals[0] === 'config') return runConfig(options, stdout);
  if (positionals[0] === 'mcp') return runMcp(options);
  if (positionals[0] === 'mcp-client') return runMcpClient(positionals[1], options, stdout);
  if (positionals[0] === 'daemon') return runDaemon(positionals[1] ?? 'status', options, stdout);
  const config = loadConfig();
  if (options.broker || (config.connectionMode === 'daemon' && !options.direct)) {
    const brokerInput = await readSource(positionals, options, stdin);
    if (brokerInput.kind === 'source') return runBrokerScript(brokerInput.source, options, stdout);
    return runBrokerCommand(brokerInput.command, options, stdout);
  }

  const source = await readSource(positionals, options, stdin);
  validateTimeout(options.timeout);
  const errors = registerHandlers({ log });
  let shutdownHook;
  let activeRuntime;
  try {
    shutdownHook = registerSignals({ log, exit: false, shutdownHook: async signal => activeRuntime?.shutdown(signal) });
    const result = await withTimeout(executeInput(source, options, dependencies, runtime => { activeRuntime = runtime; }), options.timeout);
    if (result !== undefined) writeResult(result, options, stdout);
    return result;
  } finally {
    await shutdownHook?.shutdown?.();
    shutdownHook?.removeHandlers?.();
    errors.removeHandlers();
  }
}

function runConfig(options, stdout) {
  const value = redactedConfig(loadConfig());
  writeResult(value, { ...options, json: true }, stdout);
  return value;
}

async function runMcp(options) {
  const { startMcpServer } = await import('./mcp/server.mjs');
  const config = loadConfig();
  return startMcpServer({ config, stdio: options.stdio === true, token: config.token });
}

async function runMcpClient(action = 'inspect', options, stdout) {
  const { inspectMcpServer } = await import('./mcp/client.mjs');
  const result = await inspectMcpServer(loadConfig(), { action: action === 'list-tools' ? 'tools' : action === 'list-resources' ? 'resources' : action === 'list-prompts' ? 'prompts' : action });
  writeResult(result, options, stdout);
  return result;
}

async function runBrokerCommand(command, options, stdout) {
  const token = loadConfig().token;
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const result = await brokerRequest({ token, method: 'command', command, options });
  if (!result.ok) throw Object.assign(new Error(result.error), { code: result.code, exitCode: result.exitCode ?? 1 });
  if (result.value !== undefined) stdout(result.value);
  return result.value;
}

async function runBrokerScript(source, options, stdout) {
  const token = loadConfig().token;
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  const result = await brokerRequest({ token, method: 'script', source, options });
  if (!result.ok) throw Object.assign(new Error(result.error), { code: result.code, exitCode: result.exitCode ?? 1 });
  if (result.value !== undefined) stdout(result.value);
  return result.value;
}

async function runDaemon(action, options, stdout) {
  const config = validateConfig(loadConfig());
  const token = config.token;
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  if (action === 'start') {
    const broker = await withGatewayRetry(() => startGatewayBroker({ token }));
    const configuredMcpPort = options.mcp_port ?? (config.daemonMode === 'mcp' ? config.mcp.port : undefined);
    if (configuredMcpPort !== undefined && configuredMcpPort !== null) {
      const mcpPort = validateMcpPort(configuredMcpPort);
      const { startMcpServer, closeMcpServer } = await import('./mcp/server.mjs');
      try {
        const mcp = await startMcpServer({ config, httpPort: mcpPort, token, context: { runtime: broker.runtime } });
        broker.setOnClose(() => closeMcpServer(mcp));
      } catch (error) {
        await broker.close();
        throw error;
      }
    }
    stdout({ started: true, endpoint: broker.endpoint, ...(configuredMcpPort !== undefined && configuredMcpPort !== null ? { mcpPort: validateMcpPort(configuredMcpPort) } : {}) });
    return broker;
  }
  const result = await brokerRequest({ token, method: action === 'stop' ? 'shutdown' : 'status' });
  stdout(result);
  return result;
}

function validateMcpPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Object.assign(new Error('--mcp-port must be an integer between 1 and 65535.'), { code: 'INVALID_MCP_PORT', exitCode: 2 });
  return port;
}
