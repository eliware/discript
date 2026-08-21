import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandCatalog } from '../../commands.mjs';
import { z } from '@eliware/mcp-server';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

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
  if (mcpServer.server) mcpServer.server._instructions = 'Discript is a Discord scripting runtime for CLI and AI-agent automation. Use run_discript for one command or a source program. Discover discript://help, discript://commands, discript://language, and discript://safety before acting. Prefer read-only inventory and dryRun=true previews; require force=true for destructive changes. Keep tokens and other secrets in environment variables, and correlate executions with the requestId returned by the tool.';
  for (const [uri, resource] of Object.entries(staticResources)) {
    mcpServer.registerResource(resource.name, uri, { title: resource.title, description: resource.description, mimeType: resource.mimeType, annotations: { audience: ['assistant'], priority: 0.8 } }, async requestedUri => ({ contents: [{ uri: requestedUri.toString(), mimeType: resource.mimeType, text: resource.text }] }));
  }
  mcpServer.registerResource('discript-example', new ResourceTemplate('discript://examples/{name}', { list: undefined }), { title: 'Discript example', description: 'Read a Discript example.', mimeType: 'text/plain', annotations: { audience: ['assistant'], priority: 0.7 } }, async (uri, variables) => {
    const name = String(variables.name).replaceAll('..', '');
    const file = join(projectRoot, 'examples', name.endsWith('.ds') ? name : `${name}.ds`);
    return { contents: [{ uri: uri.toString(), mimeType: 'text/plain', text: await readFile(file, 'utf8') }] };
  });
  mcpServer.registerPrompt('inventory', { title: 'Discord inventory', description: 'Generate a safe read-only Discord inventory request.', argsSchema: { guild: z.string().optional() } }, ({ guild }) => promptMessage(`Inventory the Discord server${guild ? ` with guild ID ${guild}` : ''}. Use read-only commands and do not mutate state.`));
  mcpServer.registerPrompt('safe-mutation', { title: 'Safe mutation', description: 'Plan a mutation with dry-run and approval steps.', argsSchema: { request: z.string(), guild: z.string().optional() } }, ({ request, guild }) => promptMessage(`Plan this Discord mutation${guild ? ` in guild ${guild}` : ''}: ${request}. First run with dryRun=true, inspect the result, then require explicit approval before force=true.`));
  mcpServer.registerPrompt('server-provisioning', { title: 'Server provisioning', description: 'Generate a repeatable server provisioning plan.', argsSchema: { request: z.string(), guild: z.string().optional() } }, ({ request, guild }) => promptMessage(`Create a repeatable Discript provisioning script for${guild ? ` guild ${guild}` : ' a Discord server'}: ${request}. Include categories, text and voice channels, roles, permission overrides, ordering, welcome content, dry-run validation, and an explicit approval step.`));
  mcpServer.registerPrompt('rollback', { title: 'Rollback planning', description: 'Plan a safe rollback for a Discord change.', argsSchema: { change: z.string(), guild: z.string().optional() } }, ({ change, guild }) => promptMessage(`Design a rollback plan for${guild ? ` guild ${guild}` : ' the target Discord server'} after this change: ${change}. Inventory current state first, identify reversible operations, preview every mutation, and require force approval for destructive actions.`));
  mcpServer.registerPrompt('debugging', { title: 'Discord debugging', description: 'Generate a read-only diagnostic workflow.', argsSchema: { symptom: z.string(), guild: z.string().optional() } }, ({ symptom, guild }) => promptMessage(`Diagnose this Discord automation symptom${guild ? ` in guild ${guild}` : ''}: ${symptom}. Start with read-only inventory and permissions checks, collect structured results, and do not mutate anything until the cause is confirmed.`));
  mcpServer.registerPrompt('script-generation', { title: 'Discript script generation', description: 'Generate an agent-friendly Discript script.', argsSchema: { request: z.string(), guild: z.string().optional() } }, ({ request, guild }) => promptMessage(`Generate a Discript script${guild ? ` targeting guild ${guild}` : ''} for: ${request}. Use environment variables for secrets and IDs, capture intermediate results, branch on exit codes, preview mutations, and require explicit force approval for destructive operations.`));
}

function promptMessage(text) {
  return { messages: [{ role: 'user', content: { type: 'text', text } }] };
}
