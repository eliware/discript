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

export class ScriptThrow extends Error {
  constructor(value) {
    super(typeof value === 'string' ? value : value?.message ?? 'Script threw a value.');
    this.name = 'ScriptThrow';
    this.code = value?.code ?? 'SCRIPT_THROW';
    this.value = value;
    this.exitCode = value?.exitCode ?? 1;
  }
}

export class BreakSignal extends Error { constructor() { super('Break'); this.name = 'BreakSignal'; } }
export class ContinueSignal extends Error { constructor() { super('Continue'); this.name = 'ContinueSignal'; } }
