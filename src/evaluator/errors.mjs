export function runtimeError(message) { return Object.assign(new Error(message), { code: 'RUNTIME_ERROR', exitCode: 1 }); }

export function normalizeError(error) {
  return { code: error?.code ?? 'DISCRIPT_ERROR', message: error?.message ?? String(error), exitCode: error?.exitCode ?? 1 };
}

export class ScriptExit extends Error {
  constructor(exitCode = 0, message = null) {
    super(message ?? `Script exited with status ${exitCode}.`);
    this.name = 'ScriptExit'; this.code = 'SCRIPT_EXIT'; this.exitCode = Number(exitCode); this.details = message ? { message } : undefined;
  }
}
