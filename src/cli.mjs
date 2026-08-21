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
import { loadConfig } from './config.mjs';
import { withGatewayRetry } from './gateway-retry.mjs';

export async function run(argv = [], dependencies = {}) {
  const { stdout = console.log, stdin = process.stdin } = dependencies;
  const { positionals, options } = parseArgs(argv);
  if (options.help) return stdout(helpText());
  if (options.version) return stdout(VERSION);
  if (positionals[0] === 'mcp') return runMcp(options);
  if (positionals[0] === 'daemon') return runDaemon(positionals[1] ?? 'status', options, stdout);
  if (options.broker) {
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

async function runMcp(options) {
  const { startMcpServer } = await import('./mcp/server.mjs');
  const token = loadConfig().token;
  return startMcpServer({ stdio: options.stdio === true, token });
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
  const token = loadConfig().token;
  if (!token) throw Object.assign(new Error('DISCORD_TOKEN is not set.'), { code: 'DISCORD_TOKEN_MISSING', exitCode: 4 });
  if (action === 'start') {
    const broker = await withGatewayRetry(() => startGatewayBroker({ token }));
    stdout({ started: true, endpoint: broker.endpoint });
    return broker;
  }
  const result = await brokerRequest({ token, method: action === 'stop' ? 'shutdown' : 'status' });
  stdout(result);
  return result;
}
