import { readFile } from "node:fs/promises";
import { executeDirectCommand } from "./commands.mjs";
import { dirname, resolve } from "node:path";
import { writeResult } from "../output.mjs";
import { parse } from "../parser.mjs";
import { evaluate, ScriptExit } from "../evaluator.mjs";
import { createDiscordApi } from "../discord.mjs";
import { createDiscordRest } from "../rest.mjs";
import { createEnvironment } from "../env.mjs";
import { createJsonHelpers } from './json.mjs';
import { createLanguageBuiltins } from '../language/builtins.mjs';
export async function executeInput(input, options, dependencies, onRuntime = () => {}) {
  if (input.kind === 'command') return executeDirectCommand(input.command, options, dependencies);
  if (options.dry_run) return { dryRun: true, source: input.source };
  const runtime = dependencies.runtime ?? await (async () => { const { createDiscordRuntime } = await import('../runtime.mjs'); return createDiscordRuntime(); })();
  const ownsRuntime = !dependencies.runtime;
  onRuntime(runtime);
    const timers = new Set();
    const eventHandlers = new Set();
    const deferred = [];
    const moduleCache = new Map();
  const signal = dependencies.signal;
  try {
    if (signal?.aborted) throw Object.assign(new Error('Execution was cancelled.'), { code: 'EXECUTION_CANCELLED', exitCode: 130 });
    let handlerCount = 0;
    const registerTimer = (delay, callback, repeating) => {
      const milliseconds = Number(delay);
      if (!Number.isInteger(milliseconds) || milliseconds < 1) throw Object.assign(new Error('Timer delay must be a positive integer in milliseconds.'), { code: 'INVALID_TIMER', exitCode: 2 });
      const timer = repeating ? setInterval(() => { void callback(); }, milliseconds) : setTimeout(() => { void callback(); }, milliseconds);
      timers.add(timer);
      let active = true;
      return { timer: repeating ? 'interval' : 'timeout', delay: milliseconds, registered: true, cancel: () => { if (!active) return false; active = false; clearTimeout(timer); clearInterval(timer); timers.delete(timer); return true; } };
    };
    const baseDir = input.origin && !['eval', 'stdin'].includes(input.origin) ? dirname(resolve(input.origin)) : process.cwd();
    const rest = options.rest === true
      ? createDiscordRest({ token: dependencies.token, rest: dependencies.rest })
      : null;
    const result = await evaluate(parse(input.source), {
      env: createEnvironment(),
      args: input.args ?? [],
      ...createLanguageBuiltins(),
      json: createJsonHelpers(),
      discord: createDiscordApi(runtime.client, { ...options, rest }),
      find: (items, property, expected) => (items ?? []).find(item => item?.[property] === expected),
      filter: async (items, selector, expected) => {
        if (typeof selector === 'function') {
          const values = await Promise.all((items ?? []).map(async item => [item, await selector(item)]));
          return values.filter(([, keep]) => keep).map(([item]) => item);
        }
        return (items ?? []).filter(item => item?.[selector] === expected);
      },
      exit: (exitCode = 0, message = null) => { throw new ScriptExit(exitCode, message); },
      defer: callback => {
        if (typeof callback !== 'function') throw Object.assign(new Error('defer() expects a function.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
        deferred.push(callback);
        return { deferred: true, count: deferred.length };
      },
      print: value => { writeResult(value, options, dependencies.stdout ?? console.log); return value; },
      on: (eventName, handler) => {
        runtime.client.on(eventName, handler);
        const registration = [eventName, handler];
        eventHandlers.add(registration);
        handlerCount += 1;
        let active = true;
        return { event: eventName, registered: true, cancel: () => { if (!active) return false; active = false; runtime.client.off(eventName, handler); eventHandlers.delete(registration); return true; } };
      },
      every: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, true); },
      after: (delay, callback) => { handlerCount += 1; return registerTimer(delay, callback, false); },
      sleep: delay => new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, Number(delay));
        const cancel = () => { clearTimeout(timer); reject(Object.assign(new Error('Execution was cancelled.'), { code: 'EXECUTION_CANCELLED', exitCode: 130 })); };
        signal?.addEventListener('abort', cancel, { once: true });
      }),
      parallel: (...operations) => Promise.all(operations),
      map: async (items, callback) => Promise.all((items ?? []).map(item => callback(item))),
      reduce: async (items, callback, initial) => {
        let accumulator = initial;
        for (const item of items ?? []) accumulator = await callback(accumulator, item);
        return accumulator;
      },
      importScript: async (sourcePath, sharedScope, importerBaseDir = baseDir, isolated = false) => {
        const importedPath = resolve(importerBaseDir, sourcePath);
        if (isolated && moduleCache.has(importedPath)) return moduleCache.get(importedPath);
        const source = await readFile(importedPath, 'utf8');
        const moduleExports = {};
        if (isolated) {
          moduleCache.set(importedPath, moduleExports);
          const moduleScope = new Map(sharedScope);
          moduleScope.set('exports', moduleExports);
          try { await evaluate(parse(source), {}, { scope: moduleScope, baseDir: dirname(importedPath) }); }
          catch (error) { moduleCache.delete(importedPath); throw error; }
        } else {
          sharedScope.set('exports', moduleExports);
          try { await evaluate(parse(source), {}, { scope: sharedScope, baseDir: dirname(importedPath) }); }
          finally { sharedScope.delete('exports'); }
        }
        return moduleExports;
      },
    }, { baseDir });
    const keepAlive = options.keep_alive ?? options.keepAlive;
    if (handlerCount > 0 && keepAlive !== false) await waitForStop(runtime, signal);
    return result;
  } finally {
    for (let index = deferred.length - 1; index >= 0; index -= 1) await deferred[index]();
    for (const timer of timers) { clearTimeout(timer); clearInterval(timer); }
    for (const [eventName, handler] of eventHandlers) runtime.client.off(eventName, handler);
    if (ownsRuntime) await runtime.shutdown();
  }
}

function waitForStop(runtime, signal) {
  if (!signal) return runtime.waitForStop();
  return Promise.race([
    runtime.waitForStop(),
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('Execution was cancelled.'), { code: 'EXECUTION_CANCELLED', exitCode: 130 })), { once: true })),
  ]);
}
