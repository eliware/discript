import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandCatalog } from '../../commands.mjs';
import { z } from '@eliware/mcp-server';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const staticResources = {
  'discript://help': {
    name: 'discript-help', title: 'Discript MCP help', description: 'How to use Discript through MCP.', mimeType: 'text/markdown', text: '# Discript MCP\n\nUse the run_discript tool for Discord commands and scripts. Preview mutations with dryRun=true; destructive operations require force=true.',
  },
  'discript://commands': {
    name: 'discript-commands', title: 'Discript command catalog', description: 'The current direct command catalog.', mimeType: 'application/json', get text() { return JSON.stringify(commandCatalog(), null, 2); },
  },
  'discript://language': {
    name: 'discript-language', title: 'Discript language guide', description: 'Discript source syntax and execution model.', mimeType: 'text/markdown', text: '# Discript language\n\nScripts support expressions, variables, conditionals, loops, functions, events, timers, environment variables, dry-run, force approval, and exit codes.',
  },
  'discript://safety': {
    name: 'discript-safety', title: 'Discript safety guide', description: 'Mutation and destructive-operation safety rules.', mimeType: 'text/markdown', text: '# Discript safety\n\nUse dry-run to preview state changes. Destructive operations require explicit force approval (`-y` on the CLI or `force: true` in MCP/script execution). Keep tokens and secrets in environment variables.',
  },
};

export default function registerDiscriptInfo({ mcpServer }) {
  for (const [uri, resource] of Object.entries(staticResources)) {
    mcpServer.registerResource(resource.name, uri, { title: resource.title, description: resource.description, mimeType: resource.mimeType }, async requestedUri => ({ contents: [{ uri: requestedUri.toString(), mimeType: resource.mimeType, text: resource.text }] }));
  }
  mcpServer.registerResource('discript-example', { uriTemplate: 'discript://examples/{name}', name: 'discript-example', description: 'A Discript example script by filename.' }, { title: 'Discript example', description: 'Read a packaged Discript example.', mimeType: 'text/plain' }, async (uri, variables) => {
    const name = String(variables.name).replaceAll('..', '');
    const file = join(projectRoot, 'examples', name.endsWith('.ds') ? name : `${name}.ds`);
    return { contents: [{ uri: uri.toString(), mimeType: 'text/plain', text: await readFile(file, 'utf8') }] };
  });
  mcpServer.registerPrompt('inventory', { title: 'Discord inventory', description: 'Generate a safe read-only Discord inventory request.', argsSchema: { guild: z.string().optional() } }, ({ guild }) => promptMessage(`Inventory the Discord server${guild ? ` with guild ID ${guild}` : ''}. Use read-only commands and do not mutate state.`));
  mcpServer.registerPrompt('safe-mutation', { title: 'Safe mutation', description: 'Plan a mutation with dry-run and approval steps.', argsSchema: { request: z.string(), guild: z.string().optional() } }, ({ request, guild }) => promptMessage(`Plan this Discord mutation${guild ? ` in guild ${guild}` : ''}: ${request}. First run with dryRun=true, inspect the result, then require explicit approval before force=true.`));
}

function promptMessage(text) {
  return { messages: [{ role: 'user', content: { type: 'text', text } }] };
}
