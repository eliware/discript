#!/usr/bin/env node

import { run } from '../src/cli.mjs';

try {
  await run(process.argv.slice(2));
} catch (error) {
  const { formatError } = await import('../src/errors.mjs');
  const { parseArgs } = await import('../src/args.mjs');
  const { options } = parseArgs(process.argv.slice(2));
  console.error(formatError(error, options));
  process.exitCode = error.exitCode ?? 1;
}
