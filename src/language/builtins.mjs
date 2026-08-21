export const LANGUAGE_VERSION = '1.0';

export function createLanguageBuiltins({ clock = () => new Date() } = {}) {
  return {
    length(value) {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'string' || Array.isArray(value)) return value.length;
      if (typeof value === 'object') return Object.keys(value).length;
      throw Object.assign(new Error('length() expects a string, array, or object.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
    },
    keys(value) {
      if (!value || typeof value !== 'object') throw Object.assign(new Error('keys() expects an object.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return Object.keys(value);
    },
    values(value) {
      if (!value || typeof value !== 'object') throw Object.assign(new Error('values() expects an object.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return Object.values(value);
    },
    split(value, separator = '') {
      if (typeof value !== 'string' || typeof separator !== 'string') throw Object.assign(new Error('split() expects strings.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return value.split(separator);
    },
    join(values, separator = '') {
      if (!Array.isArray(values) || typeof separator !== 'string') throw Object.assign(new Error('join() expects an array and a string separator.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return values.join(separator);
    },
    includes(value, search) {
      if (typeof value !== 'string' && !Array.isArray(value)) throw Object.assign(new Error('includes() expects a string or array.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return value.includes(search);
    },
    lower(value) {
      if (typeof value !== 'string') throw Object.assign(new Error('lower() expects a string.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return value.toLowerCase();
    },
    upper(value) {
      if (typeof value !== 'string') throw Object.assign(new Error('upper() expects a string.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return value.toUpperCase();
    },
    trim(value) {
      if (typeof value !== 'string') throw Object.assign(new Error('trim() expects a string.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      return value.trim();
    },
    language: {
      version: LANGUAGE_VERSION,
      supports(feature) {
        return new Set(['arrays', 'objects', 'functions', 'closures', 'events', 'modules', 'optional-access', 'destructuring', 'async', 'capabilities']).has(String(feature));
      },
      requireVersion(required) {
        const requested = parseVersion(required);
        const current = parseVersion(LANGUAGE_VERSION);
        if (!requested || requested.major !== current.major || requested.minor > current.minor) throw Object.assign(new Error(`Discript language version ${required} is not supported; current version is ${LANGUAGE_VERSION}.`), { code: 'LANGUAGE_VERSION_UNSUPPORTED', exitCode: 2, details: { requested: String(required), current: LANGUAGE_VERSION } });
        return true;
      },
    },
    range(start, end = null, step = 1) {
      const first = end === null ? 0 : Number(start);
      const last = end === null ? Number(start) : Number(end);
      const increment = Number(end === null ? step : step);
      if (!Number.isFinite(first) || !Number.isFinite(last) || !Number.isFinite(increment) || increment === 0) throw Object.assign(new Error('range() expects finite numbers and a non-zero step.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      const result = [];
      if ((increment > 0 && first >= last) || (increment < 0 && first <= last)) return result;
      for (let value = first; increment > 0 ? value < last : value > last; value += increment) {
        if (result.length >= 10000) throw Object.assign(new Error('range() exceeded the 10000 item limit.'), { code: 'LOOP_LIMIT', exitCode: 1 });
        result.push(value);
      }
      return result;
    },
    now() { return clock().toISOString(); },
    race(...operations) { return Promise.race(operations); },
    allSettled(...operations) { return Promise.allSettled(operations); },
    timeout(operation, milliseconds) {
      const delay = Number(milliseconds);
      if (!Number.isInteger(delay) || delay < 1) return Promise.reject(Object.assign(new Error('timeout() requires a positive integer duration.'), { code: 'INVALID_ARGUMENT', exitCode: 2 }));
      return Promise.race([operation, new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(`Operation timed out after ${delay}ms.`), { code: 'OPERATION_TIMEOUT', exitCode: 6 })), delay))]);
    },
    async retry(callback, attempts = 3, delay = 0) {
      if (typeof callback !== 'function') throw Object.assign(new Error('retry() expects a callback.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      const count = Number(attempts);
      const wait = Number(delay);
      if (!Number.isInteger(count) || count < 1 || !Number.isInteger(wait) || wait < 0) throw Object.assign(new Error('retry() expects positive attempts and a non-negative delay.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      let lastError;
      for (let attempt = 1; attempt <= count; attempt += 1) {
        try { return await callback(attempt); } catch (error) { lastError = error; if (attempt < count && wait > 0) await new Promise(resolve => setTimeout(resolve, wait)); }
      }
      throw lastError;
    },
    async mapLimit(items, limit, callback) {
      if (!Array.isArray(items) || typeof callback !== 'function') throw Object.assign(new Error('mapLimit() expects an array and callback.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      const concurrency = Number(limit);
      if (!Number.isInteger(concurrency) || concurrency < 1) throw Object.assign(new Error('mapLimit() limit must be a positive integer.'), { code: 'INVALID_ARGUMENT', exitCode: 2 });
      const results = new Array(items.length);
      let next = 0;
      async function worker() {
        while (next < items.length) {
          const index = next++;
          results[index] = await callback(items[index]);
        }
      }
      await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
      return results;
    },
  };
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)$/.exec(String(value ?? '').trim());
  return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
}
