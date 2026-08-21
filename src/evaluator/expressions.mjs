export function createExpressionEvaluator({ scope, scopeContext, createChildScope, evaluateBlock, evaluateExpression, normalizeError, runtimeError, ScriptExit }) {
  return async function evaluateExpressionNode(expression) {
    if (expression.type === 'Literal') return expression.value;
    if (expression.type === 'AwaitExpression') return evaluateExpression(expression.argument);
    if (expression.type === 'UnaryExpression') {
      const value = await evaluateExpression(expression.argument);
      if (expression.operator === '!') return !value;
      if (expression.operator === '-') return -value;
      throw runtimeError(`Unsupported unary operator: ${expression.operator}`);
    }
    if (expression.type === 'ArrowExpression') {
      const capturedScope = scopeContext.getStore() ?? scope;
      return async value => {
      const localScope = createChildScope(capturedScope); if (expression.parameter) localScope.values.set(expression.parameter, value);
      return scopeContext.run(localScope, async () => expression.body.type === 'ExpressionBody' ? evaluateExpression(expression.body.body) : evaluateBlock(expression.body.body));
      };
    }
    if (expression.type === 'TryExpression') {
      let result;
      try {
        const value = await evaluateBlock(expression.body);
        result = { ok: true, exitCode: 0, value };
      } catch (error) {
        if (error instanceof ScriptExit) throw error;
        scope.set(expression.binding, normalizeError(error));
        await evaluateBlock(expression.handler);
        result = { ok: false, exitCode: error?.exitCode ?? 1, error: normalizeError(error) };
      } finally {
        if (expression.finalizer) await evaluateBlock(expression.finalizer);
      }
      return result;
    }
    if (expression.type === 'BinaryExpression') {
      const left = await evaluateExpression(expression.left);
      if (expression.operator === '&&') return left && await evaluateExpression(expression.right);
      if (expression.operator === '||') return left || await evaluateExpression(expression.right);
      if (expression.operator === '??') return left ?? await evaluateExpression(expression.right);
      const right = await evaluateExpression(expression.right);
      if (expression.operator === '==') return left === right; if (expression.operator === '!=') return left !== right;
      if (expression.operator === '>') return left > right; if (expression.operator === '<') return left < right; if (expression.operator === '>=') return left >= right; if (expression.operator === '<=') return left <= right;
      if (expression.operator === '+') return left + right; if (expression.operator === '-') return left - right; if (expression.operator === '*') return left * right; if (expression.operator === '/') return left / right; if (expression.operator === '%') return left % right; if (expression.operator === '**') return left ** right;
      throw runtimeError(`Unsupported operator: ${expression.operator}`);
    }
    if (expression.type === 'ArrayExpression') {
      const values = [];
      for (const element of expression.elements) {
        const value = await evaluateExpression(element.type === 'SpreadElement' ? element.argument : element);
        if (element.type === 'SpreadElement') {
          if (!value || typeof value[Symbol.iterator] !== 'function') throw runtimeError('Array spread expects an iterable value.');
          values.push(...value);
        } else values.push(value);
      }
      return values;
    }
    if (expression.type === 'ObjectExpression') {
      const value = {};
      for (const property of expression.properties) {
        if (property.type === 'SpreadProperty') {
          const spread = await evaluateExpression(property.argument);
          if (!spread || typeof spread !== 'object') throw runtimeError('Object spread expects an object value.');
          Object.assign(value, spread);
        } else value[property.key] = await evaluateExpression(property.value);
      }
      return value;
    }
    if (expression.type === 'Identifier') { if (!scope.has(expression.name)) throw runtimeError('Unknown variable: ' + expression.name); return scope.get(expression.name); }
    if (expression.type === 'MemberExpression') {
      const object = await evaluateExpression(expression.object);
      if (object === null || object === undefined) {
        if (expression.optional) return undefined;
        throw runtimeError(`Cannot read property '${expression.property}' from a null value.`);
      }
      const value = object?.[expression.property];
      return typeof value === 'function' ? value.bind(object) : value;
    }
    if (expression.type === 'IndexExpression') {
      const object = await evaluateExpression(expression.object);
      if (object === null || object === undefined) {
        if (expression.optional) return undefined;
        throw runtimeError('Cannot index a null value.');
      }
      const property = await evaluateExpression(expression.property);
      const value = object?.[property];
      return typeof value === 'function' ? value.bind(object) : value;
    }
    if (expression.type === 'CallExpression') {
      const callee = await evaluateExpression(expression.callee);
      if (callee === null || callee === undefined) { if (expression.optional) return undefined; throw runtimeError('The expression is not callable.'); }
      if (typeof callee !== 'function') throw runtimeError('The expression is not callable.');
      return callee(...await Promise.all(expression.arguments.map(evaluateExpression)));
    }
    if (expression.type === 'ConditionalExpression') return (await evaluateExpression(expression.test)) ? evaluateExpression(expression.consequent) : evaluateExpression(expression.alternate);
    throw runtimeError(`Unsupported expression: ${expression.type}`);
  };
}
