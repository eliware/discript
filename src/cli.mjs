import dotenv from 'dotenv';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Load the project-local file first, then the user-level fallback. dotenv does
// not overwrite existing values, so shell exports and local configuration win.
dotenv.config();
dotenv.config({ path: join(homedir(), '.discript.env') });


import { log, registerHandlers, registerSignals } from '@eliware/common';
import { parseArgs } from './args.mjs';
import { helpText, VERSION } from './help.mjs';
import { readSource } from './input.mjs';
import { writeResult } from './output.mjs';




import { withTimeout, validateTimeout } from "./cli/lifecycle.mjs";
import { executeInput } from './cli/script.mjs';

export async function run(argv = [], dependencies = {}) {
  const { stdout = console.log, stdin = process.stdin } = dependencies;
  const { positionals, options } = parseArgs(argv);
  if (options.help) return stdout(helpText());
  if (options.version) return stdout(VERSION);

  const source = await readSource(positionals, options, stdin);
  validateTimeout(options.timeout);
  const errors = registerHandlers({ log });
  let shutdownHook;
  let activeRuntime;
  try {
    shutdownHook = registerSignals({ log, exit: false, shutdownHook: async signal => activeRuntime?.shutdown(signal) });
    const result = await withTimeout(executeInput(source, options, dependencies, runtime => { activeRuntime = runtime; }), options.timeout);
    if (result !== undefined) writeResult(result, options, stdout);
    return result;
  } finally {
    await shutdownHook?.shutdown?.();
    shutdownHook?.removeHandlers?.();
    errors.removeHandlers();
  }
}
