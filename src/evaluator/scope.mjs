import { AsyncLocalStorage } from 'node:async_hooks';

export class LexicalScope {
  constructor(parent = null, entries = []) {
    this.parent = parent;
    this.values = new Map(entries);
  }

  has(name) { return this.values.has(name) || Boolean(this.parent?.has(name)); }
  get(name) { return this.values.has(name) ? this.values.get(name) : this.parent?.get(name); }
  set(name, value) {
    if (this.values.has(name) || !this.parent?.has(name)) this.values.set(name, value);
    else this.parent.set(name, value);
    return this;
  }
  delete(name) { return this.values.delete(name) || Boolean(this.parent?.delete(name)); }
  entries() {
    const values = this.parent ? [...this.parent.entries()] : [];
    const own = new Map(values);
    for (const [key, value] of this.values) own.set(key, value);
    return own.entries();
  }
  [Symbol.iterator]() { return this.entries(); }
  get size() { return [...this.entries()].length; }
}

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
  return { baseScope, context, scope, createChildScope: parent => new LexicalScope(parent) };
}
