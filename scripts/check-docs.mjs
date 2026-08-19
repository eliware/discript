import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMANDS } from '../src/commands.mjs';
import { parse } from '../src/parser/index.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const docsRoot = join(root, 'docs');
const markdownFiles = filesUnder(docsRoot, '.md');
const failures = [];

for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(file), target))) failures.push(`${relative(file)}: missing link target ${target}`);
  }
}

const commandReference = readFileSync(join(docsRoot, 'cli', 'commands.md'), 'utf8');
for (const command of COMMANDS) if (!commandReference.includes(command)) failures.push(`docs/cli/commands.md: missing command ${command}`);

const examples = filesUnder(join(root, 'examples'), '.ds');
for (const file of examples) {
  try { parse(readFileSync(file, 'utf8')); }
  catch (error) { failures.push(`${relative(file)}: parse failure: ${error.message}`); }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation check passed: ${markdownFiles.length} Markdown files, ${COMMANDS.length} CLI commands, ${examples.length} Discript examples.`);
}

function filesUnder(directory, extension) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path, extension) : entry.name.endsWith(extension) ? [path] : [];
  });
}

function relative(file) { return file.slice(root.length + 1); }
