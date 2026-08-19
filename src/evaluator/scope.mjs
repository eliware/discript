import { AsyncLocalStorage } from 'node:async_hooks';

export function createScope(globals, sharedScope) {
  const baseScope = sharedScope ?? new Map(Object.entries(globals));
  const context = new AsyncLocalStorage();
  const scope = new Proxy(baseScope, {
    get(target, property) {
      const current = context.getStore() ?? target;
      const value = Reflect.get(current, property);
      return typeof value === 'function' ? value.bind(current) : value;
    },
  });
  return { baseScope, context, scope };
}
