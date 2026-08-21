import { z, buildResponse } from '@eliware/mcp-server';
import { randomUUID } from 'node:crypto';
import { executeInput } from '../../cli/script.mjs';
import { withTimeout, validateTimeout } from '../../cli/lifecycle.mjs';
import { structuredError } from '../../errors.mjs';

const inputSchema = {
  source: z.string().min(1).optional().describe('Discript source to evaluate.'),
  command: z.array(z.string().min(1)).min(1).optional().describe('Direct Discript command tokens, for example ["guilds", "list"].'),
  dryRun: z.boolean().optional().describe('Preview without applying mutations.'),
  force: z.boolean().optional().describe('Approve destructive operations.'),
  keepAlive: z.boolean().optional().describe('Keep event handlers and timers active until the MCP request ends; defaults to false for finite MCP calls.'),
  timeout: z.number().int().positive().max(300000).optional().describe('Execution timeout in milliseconds.'),
  rest: z.boolean().optional().describe('Prefer REST for supported operations.'),
};

export default function registerRunDiscript({ mcpServer, runtime }) {
  mcpServer.tool(
    'run_discript',
    'Execute one Discript source program or direct Discord command. Prefer dryRun=true before mutations; destructive operations require force=true.',
    inputSchema,
    async ({ source, command, dryRun = false, force = false, keepAlive = false, timeout, rest }, extra = {}) => {
      if ((source === undefined) === (command === undefined)) {
        throw Object.assign(new Error('Exactly one of source or command is required.'), { code: 'MCP_INPUT_REQUIRED', exitCode: 2 });
      }
      const limits = mcpServer.context?.mcpLimits ?? {};
      const log = mcpServer.context?.mcpLog ?? {};
      const requestId = randomUUID();
      const startedAt = Date.now();
      const mode = source === undefined ? 'command' : 'source';
      const effectiveTimeout = timeout ?? limits.timeout;
      validateTimeout(effectiveTimeout);
      enforceScope({ source, command, dryRun, force }, extra);
      // Direct commands use the CLI spelling; source evaluation also consumes
      // the camelCase API option when constructing the Discord facade.
      const effectiveRest = source === undefined ? rest !== false : rest === true;
      const options = { dry_run: dryRun, dryRun, yes: force, ...(source !== undefined ? { keep_alive: keepAlive, keepAlive } : {}), rest: effectiveRest };
      const input = source === undefined
        ? { kind: 'command', command }
        : { kind: 'source', source, origin: 'mcp' };
      const controller = new AbortController();
      let release;
      let outcome;
      log.debug?.({ event: 'mcp.execution.started', requestId, mode, dryRun, force, rest });
      try {
        release = await limits.limiter?.acquire?.();
        const value = await withTimeout(executeInput(input, options, { runtime, signal: controller.signal, ...(mcpServer.context?.token !== undefined ? { token: mcpServer.context.token } : {}) }), effectiveTimeout, { onTimeout: () => controller.abort() });
        const result = {
          ok: true,
          requestId,
          exitCode: 0,
          value,
          warnings: Array.isArray(value?.warnings) ? value.warnings : [],
          diagnostics: Array.isArray(value?.diagnostics) ? value.diagnostics : [],
        };
        outcome = result;
        const maxOutputBytes = limits.maxOutputBytes;
        if (maxOutputBytes && Buffer.byteLength(JSON.stringify(result)) > maxOutputBytes) throw Object.assign(new Error(`MCP response exceeded the ${maxOutputBytes}-byte output limit.`), { code: 'MCP_OUTPUT_LIMIT', exitCode: 1 });
        return buildResponse(result);
      } catch (error) {
        const failure = structuredError(error);
        const result = {
          ok: false,
          requestId,
          exitCode: failure.exitCode,
          code: failure.code,
          error: failure.error,
          ...(failure.details ? { details: failure.details } : {}),
          warnings: Array.isArray(error?.warnings) ? error.warnings : [],
          diagnostics: Array.isArray(error?.diagnostics) ? error.diagnostics : [],
        };
        outcome = result;
        return { ...buildResponse(result), isError: true };
      } finally {
        release?.();
        log.info?.({ event: 'mcp.execution.completed', requestId, mode, durationMs: Date.now() - startedAt, exitCode: outcome?.exitCode, ok: outcome?.ok === true, code: outcome?.code });
      }
    },
  );
}

function enforceScope({ source, command, dryRun, force }, extra) {
  const scopes = extra.mcpAuth?.scopes || extra._meta?.mcpAuth?.scopes;
  if (!Array.isArray(scopes)) return;
  const required = source !== undefined ? (force ? 'discord:admin' : dryRun ? 'discord:read' : 'discord:write') : commandScope(command, { dryRun, force });
  if (!hasScope(extra, required)) {
    throw Object.assign(new Error(`Missing scope: ${required}`), { code: 'MCP_SCOPE_REQUIRED', exitCode: 5, details: { scope: required } });
  }
}

function hasScope(extra, scope) {
  const scopes = extra.mcpAuth?.scopes || extra._meta?.mcpAuth?.scopes || [];
  return scopes.includes(scope);
}

function commandScope(command = [], { dryRun, force }) {
  const action = String(command[1] || '').toLowerCase();
  const destructive = ['delete', 'remove', 'kick', 'ban', 'unban', 'bulk-delete', 'leave'].includes(action);
  const mutating = ['create', 'update', 'set', 'add', 'send', 'edit', 'react', 'pin', 'unpin', 'join', 'move', 'archive', 'timeout'].includes(action);
  if (force && destructive) return 'discord:admin';
  if (dryRun || (!mutating && !destructive)) return 'discord:read';
  return 'discord:write';
}
