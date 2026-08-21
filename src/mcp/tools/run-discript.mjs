import { z, buildResponse } from '@eliware/mcp-server';
import { executeInput } from '../../cli/script.mjs';
import { withTimeout, validateTimeout } from '../../cli/lifecycle.mjs';
import { structuredError } from '../../errors.mjs';

const inputSchema = {
  source: z.string().min(1).optional().describe('Discript source to evaluate.'),
  command: z.array(z.string().min(1)).min(1).optional().describe('Direct Discript command tokens, for example ["guilds", "list"].'),
  dryRun: z.boolean().optional().describe('Preview without applying mutations.'),
  force: z.boolean().optional().describe('Approve destructive operations.'),
  timeout: z.number().int().positive().max(300000).optional().describe('Execution timeout in milliseconds.'),
  rest: z.boolean().optional().describe('Prefer REST for supported operations.'),
};

export default function registerRunDiscript({ mcpServer, runtime }) {
  mcpServer.tool(
    'run_discript',
    'Execute one Discript source program or direct Discord command. Prefer dryRun=true before mutations; destructive operations require force=true.',
    inputSchema,
    async ({ source, command, dryRun = false, force = false, timeout, rest = false }) => {
      if ((source === undefined) === (command === undefined)) {
        throw Object.assign(new Error('Exactly one of source or command is required.'), { code: 'MCP_INPUT_REQUIRED', exitCode: 2 });
      }
      const limits = mcpServer.context?.mcpLimits ?? {};
      const effectiveTimeout = timeout ?? limits.timeout;
      validateTimeout(effectiveTimeout);
      const release = await limits.limiter?.acquire?.();
      // Direct commands use the CLI spelling; source evaluation also consumes
      // the camelCase API option when constructing the Discord facade.
      const options = { dry_run: dryRun, dryRun, yes: force, rest };
      const input = source === undefined
        ? { kind: 'command', command }
        : { kind: 'source', source, origin: 'mcp' };
      try {
        const value = await withTimeout(executeInput(input, options, { runtime }), effectiveTimeout);
        const result = {
          ok: true,
          exitCode: 0,
          value,
          warnings: Array.isArray(value?.warnings) ? value.warnings : [],
          diagnostics: Array.isArray(value?.diagnostics) ? value.diagnostics : [],
        };
        const maxOutputBytes = limits.maxOutputBytes;
        if (maxOutputBytes && Buffer.byteLength(JSON.stringify(result)) > maxOutputBytes) throw Object.assign(new Error(`MCP response exceeded the ${maxOutputBytes}-byte output limit.`), { code: 'MCP_OUTPUT_LIMIT', exitCode: 1 });
        return buildResponse(result);
      } catch (error) {
        const failure = structuredError(error);
        const result = {
          ok: false,
          exitCode: failure.exitCode,
          code: failure.code,
          error: failure.error,
          ...(failure.details ? { details: failure.details } : {}),
          warnings: Array.isArray(error?.warnings) ? error.warnings : [],
          diagnostics: Array.isArray(error?.diagnostics) ? error.diagnostics : [],
        };
        return { ...buildResponse(result), isError: true };
      } finally { release?.(); }
    },
  );
}
