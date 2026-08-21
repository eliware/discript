import { readFile } from 'node:fs/promises';
import { cliError } from './args.mjs';

export async function readSource(positionals, options, stdin = process.stdin) {
  if (options.eval !== undefined) return { kind: 'source', source: options.eval, origin: 'eval', args: positionals };
  const file = positionals.length > 0 && /\.(?:ds|discript)$/i.test(positionals[0]) ? positionals[0] : null;
  if (file) return { kind: 'source', source: await readFile(file, 'utf8'), origin: file, args: positionals.slice(1) };
  if (positionals.length > 0) return { kind: 'command', command: positionals };
  if (!stdin.isTTY) {
    const source = await readStream(stdin);
    if (source.trim()) return { kind: 'source', source, origin: 'stdin', args: positionals };
  }
  throw cliError('No command or source provided. Use --help for usage.', 'MISSING_INPUT', 2);
}

async function readStream(stream) {
  let source = '';
  for await (const chunk of stream) source += chunk;
  return source;
}
