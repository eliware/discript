export class ReturnSignal {
  constructor(value) { this.value = value; }
}

export function createClosure(statement, { scope, scopeContext, evaluateBlock }) {
  return async (...values) => {
    const localScope = new Map(scope);
    for (const [index, parameter] of statement.parameters.entries()) localScope.set(parameter, values[index]);
    return scopeContext.run(localScope, async () => {
      try { return await evaluateBlock(statement.body); }
      catch (error) { if (error instanceof ReturnSignal) return error.value; throw error; }
    });
  };
}
