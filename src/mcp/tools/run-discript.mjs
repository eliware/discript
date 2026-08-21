import { z, buildResponse } from '@eliware/mcp-server';
import { executeInput } from '../../cli/script.mjs';
import { withTimeout, validateTimeout } from '../../cli/lifecycle.mjs';

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
      validateTimeout(timeout);
      const options = { dry_run: dryRun, yes: force, rest };
      const input = source === undefined
        ? { kind: 'command', command }
        : { kind: 'source', source, origin: 'mcp' };
      const value = await withTimeout(executeInput(input, options, { runtime }), timeout);
      return buildResponse({ ok: true, exitCode: 0, value });
    },
  );
}

