import { readFile } from 'node:fs/promises';
import { cliError } from './args.mjs';

export async function readSource(positionals, options, stdin = process.stdin) {
  if (options.eval !== undefined) return { kind: 'source', source: options.eval, origin: 'eval' };
  const file = positionals.length === 1 && /\.(?:ds|discript)$/i.test(positionals[0]) ? positionals[0] : null;
  if (file) return { kind: 'source', source: await readFile(file, 'utf8'), origin: file };
  if (positionals.length > 0) return { kind: 'command', command: positionals };
  if (!stdin.isTTY) return { kind: 'source', source: await readStream(stdin), origin: 'stdin' };
  throw cliError('No command or source provided. Use --help for usage.', 'MISSING_INPUT', 2);
}

async function readStream(stream) {
  let source = '';
  for await (const chunk of stream) source += chunk;
  return source;
}
