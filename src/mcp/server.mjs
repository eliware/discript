import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mcpServer } from '@eliware/mcp-server';

const toolsDir = join(dirname(fileURLToPath(import.meta.url)), 'tools');

export async function startMcpServer({ stdio = false, httpPort = 1234, token, context = {}, ...options } = {}) {
  return mcpServer({
    ...options,
    toolsDir,
    stdio,
    ...(stdio ? { httpPort: null } : { httpPort }),
    context: { token, ...context },
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
