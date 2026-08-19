import { readFile } from "node:fs/promises";
import { executeDirectCommand } from "./commands.mjs";
import { dirname, resolve } from "node:path";
import { writeResult } from "../output.mjs";
import { parse } from "../parser.mjs";
import { evaluate, ScriptExit } from "../evaluator.mjs";
import { createDiscordApi } from "../discord.mjs";
import { createEnvironment } from "../env.mjs";
export async function executeInput(input, options, dependencies, onRuntime = () => {}) {
  if (input.kind === 'command') return executeDirectCommand(input.command, options, dependencies);
  if (options.dry_run) return { dryRun: true, source: input.source };
  const runtime = dependencies.runtime ?? await (async () => { const { createDiscordRuntime } = await import('../runtime.mjs'); return createDiscordRuntime(); })();
  const ownsRuntime = !dependencies.runtime;
  onRuntime(runtime);
  const timers = new Set();
  try {
    let handlerCount = 0;
    const registerTimer = (delay, callback, repeating) => {
      const milliseconds = Number(delay);
      if (!Number.isInteger(milliseconds) || milliseconds < 1) throw Object.assign(new Error('Timer delay must be a positive integer in milliseconds.'), { code: 'INVALID_TIMER', exitCode: 2 });
      const timer = repeating ? setInterval(() => { void callback(); }, milliseconds) : setTimeout(() => { void callback(); }, milliseconds);
      timers.add(timer);
      return { timer: repeating ? 'interval' : 'timeout', delay: milliseconds, registered: true };
    };
    const baseDir = input.origin && !['eval', 'stdin'].includes(input.origin) ? dirname(resolve(input.origin)) : process.cwd();
    const result = await evaluate(parse(input.source), {
      env: createEnvironment(),
      discord: createDiscordApi(runtime.client, options),
      find: (items, property, expected) => (items ?? []).find(item => item?.[property] === expected),
      filter: async (items, selector, expected) => {
        if (typeof selector === 'function') {
          const values = await Promise.all((items ?? []).map(async item => [item, await selector(item)]));
          return values.filter(([, keep]) => keep).map(([item]) => item);
        }
        return (items ?? []).filter(item => item?.[selector] === expected);
      },
      exit: (exitCode = 0, message = null) => { throw new ScriptExit(exitCode, message); },
      print: value => { writeResult(value, options, dependencies.stdout ?? console.log); return value; },
      on: (eventName, handler) => {
        runtime.client.on(eventName, handler);
        handlerCount += 1;
        return { event: eventName, registered: true };
      },
      every: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, true); },
      after: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, false); },
      sleep: delay => new Promise(resolve => setTimeout(resolve, Number(delay))),
      parallel: (...operations) => Promise.all(operations),
      map: async (items, callback) => Promise.all((items ?? []).map(item => callback(item))),
      reduce: async (items, callback, initial) => {
        let accumulator = initial;
        for (const item of items ?? []) accumulator = await callback(accumulator, item);
        return accumulator;
      },
      importScript: async (sourcePath, sharedScope, importerBaseDir = baseDir) => {
        const importedPath = resolve(importerBaseDir, sourcePath);
        const source = await readFile(importedPath, 'utf8');
        return evaluate(parse(source), {}, { scope: sharedScope, baseDir: dirname(importedPath) });
      },
    }, { baseDir });
    if (handlerCount > 0) await runtime.waitForStop();
    return result;
  } finally {
    for (const timer of timers) { clearTimeout(timer); clearInterval(timer); }
    if (ownsRuntime) await runtime.shutdown();
  }
}
