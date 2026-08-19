import net from 'node:net';
import { createHash } from 'node:crypto';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { createDiscordRuntime } from './runtime.mjs';
import { getGatewaySessionLimits, shouldWaitForGatewayStart } from './gateway-limits.mjs';

export function brokerEndpoint(token, home = homedir(), os = platform()) {
  const id = createHash('sha256').update(String(token)).digest('hex').slice(0, 20);
  return os === 'win32' ? `\\\\.\\pipe\\discript-${id}` : join(home, `.discript-${id}.sock`);
}

export async function startGatewayBroker({ token, endpoint = brokerEndpoint(token), runtimeOptions = {}, enforceSessionLimit = true, limits } = {}) {
  const sessionLimits = limits ?? (!runtimeOptions.client && enforceSessionLimit ? await getGatewaySessionLimits({ token }) : null);
  if (sessionLimits && shouldWaitForGatewayStart(sessionLimits)) throw Object.assign(new Error(`Discord Gateway session-start limit exhausted; retry after ${sessionLimits.resetAfter}ms.`), { code: 'GATEWAY_SESSION_LIMIT', exitCode: 6, resetAfter: sessionLimits.resetAfter });
  const runtime = await createDiscordRuntime({ token, ...runtimeOptions });
  const server = net.createServer(socket => {
    let buffer = '';
    socket.setEncoding('utf8');
    socket.on('data', data => {
      buffer += data;
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        void handleBrokerRequest(line, socket, runtime);
      }
    });
  });
  await unlink(endpoint).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(endpoint, resolve); });
  let closed = false;
  return {
    endpoint,
    runtime,
    async close() {
      if (closed) return;
      closed = true;
      await runtime.shutdown();
      await new Promise(resolve => server.close(resolve));
      await unlink(endpoint).catch(() => undefined);
    },
  };
}

async function handleBrokerRequest(line, socket, runtime) {
  try {
    const request = JSON.parse(line);
    if (request.method === 'status') reply(socket, { ok: true, ready: runtime.client.isReady?.() ?? true });
    else if (request.method === 'shutdown') { reply(socket, { ok: true }); await runtime.shutdown(); }
    else reply(socket, { ok: false, error: 'Unknown broker method.' });
  } catch (error) { reply(socket, { ok: false, error: error.message }); }
}

function reply(socket, value) { socket.write(`${JSON.stringify(value)}\n`); }

export async function brokerRequest({ token, endpoint = brokerEndpoint(token), method, timeout = 5000 } = {}) {
  return await new Promise((resolve, reject) => {
    const socket = net.createConnection(endpoint);
    let buffer = '';
    const timer = setTimeout(() => { socket.destroy(); reject(Object.assign(new Error(`Gateway broker request timed out after ${timeout}ms.`), { code: 'BROKER_TIMEOUT', exitCode: 6 })); }, timeout);
    socket.setEncoding('utf8');
    socket.on('data', data => { buffer += data; const newline = buffer.indexOf('\n'); if (newline < 0) return; clearTimeout(timer); socket.end(); resolve(JSON.parse(buffer.slice(0, newline))); });
    socket.on('error', error => { clearTimeout(timer); reject(Object.assign(new Error(`Gateway broker is unavailable: ${error.message}`), { code: 'BROKER_UNAVAILABLE', exitCode: 1, cause: error })); });
    socket.on('connect', () => socket.write(`${JSON.stringify({ method })}\n`));
  });
}
