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
  };
}
