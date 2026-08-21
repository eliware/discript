import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const VERSION = require('../package.json').version;

export function helpText() {
  return `Usage: discript [options] [script-file]\n\n` +
    `Execute Discord commands or Discript source.\n\n` +
    `Input:\n` +
    `  discript <resource> <operation>  Run a direct command\n` +
    `  discript -e <source>             Evaluate inline source\n` +
    `  discript <script-file>           Run a script file\n` +
    `  cat script.ds | discript          Read source from stdin\n` +
    `  discript commands list            List supported direct commands\n` +
    `  discript completion bash          Generate shell completion\n` +
    `  discript mcp --stdio              Run as an MCP stdio server\n` +
    `  discript mcp-client [inspect]     Inspect a configured remote MCP server\n` +
    `  discript mcp-client list-tools    List remote MCP tools\n` +
    `  discript mcp-client call --tool <name> --arguments <json>\n` +
    `  discript mcp-client read-resource --uri <uri>\n` +
    `  discript mcp-client get-prompt --name <name> --arguments <json>\n` +
    `  cat script.ds | discript mcp-client run\n` +
    `  discript daemon start --mcp-port <port>  Start daemon with MCP HTTP\n` +
    `  discript daemon start             Start the shared Gateway broker\n\n` +
    `Options:\n` +
    `  -e, --eval <source>  Evaluate source\n` +
    `  --json               Emit machine-readable JSON\n` +
    `  --output jsonl       Emit one JSON value per line\n` +
    `  --pretty             Emit human-readable output\n` +
    `  --dry-run            Preview supported mutations\n` +
    `  --validate           With --dry-run, resolve targets and permissions\n` +
    `  -y, --yes            Approve mutations\n` +
    `  --rest               Use REST for supported operations\n` +
    `  --broker             Use the persistent local Gateway broker\n` +
    `  --direct             Force direct one-shot execution\n` +
    `  --timeout <ms>       Set an execution timeout\n` +
    `  -h, --help           Show this help\n` +
    `  -v, --version        Show the installed version`;
}
