function variableName(name) {
  const key = String(name);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw Object.assign(new Error(`Invalid environment variable name: ${key}`), { code: 'INVALID_ENV_NAME', exitCode: 2 });
  return key;
}

export function createEnvironment(environment = process.env) {
  const api = {
    get(name) { return environment[variableName(name)] ?? null; },
    set(name, value) { const key = variableName(name); environment[key] = String(value); return environment[key]; },
    clear(name) { const key = variableName(name); delete environment[key]; return null; },
  };
  return new Proxy(api, {
    get(target, property) {
      if (property in target) return target[property];
      if (typeof property === 'string') return environment[property] ?? null;
      return undefined;
    },
    set(_target, property, value) { environment[variableName(property)] = String(value); return true; },
    deleteProperty(_target, property) { delete environment[variableName(property)]; return true; },
    has(target, property) { return property in target || (typeof property === 'string' && property in environment); },
  });
}
