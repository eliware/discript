import { randomUUID } from 'node:crypto';
import { structuredError } from '../errors.mjs';

export function createRequestId() {
  return randomUUID();
}

export function executionSuccess(value, { requestId = createRequestId(), warnings = [], diagnostics = [] } = {}) {
  return { ok: true, requestId, exitCode: 0, value, warnings, diagnostics };
}

export function executionFailure(error, { requestId = createRequestId(), warnings, diagnostics } = {}) {
  const failure = structuredError(error);
  return {
    ok: false,
    requestId,
    exitCode: failure.exitCode,
    code: failure.code,
    error: failure.error,
    ...(failure.details ? { details: failure.details } : {}),
    warnings: warnings ?? error?.warnings ?? [],
    diagnostics: diagnostics ?? error?.diagnostics ?? [],
  };
}

export function isExecutionResult(value) {
  return value !== null && typeof value === 'object' && typeof value.ok === 'boolean' && Number.isInteger(value.exitCode);
}
