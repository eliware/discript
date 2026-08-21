export function createExpressionEvaluator({ scope, scopeContext, evaluateBlock, evaluateExpression, normalizeError, runtimeError, ScriptExit }) {
  return async function evaluateExpressionNode(expression) {
    if (expression.type === 'Literal') return expression.value;
    if (expression.type === 'AwaitExpression') return evaluateExpression(expression.argument);
    if (expression.type === 'UnaryExpression') {
      const value = await evaluateExpression(expression.argument);
      if (expression.operator === '!') return !value;
      if (expression.operator === '-') return -value;
      throw runtimeError(`Unsupported unary operator: ${expression.operator}`);
    }
    if (expression.type === 'ArrowExpression') return async value => {
      const localScope = new Map(scope); localScope.set(expression.parameter, value);
      return scopeContext.run(localScope, async () => expression.body.type === 'ExpressionBody' ? evaluateExpression(expression.body.body) : evaluateBlock(expression.body.body));
    };
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
    if (expression.type === 'ArrayExpression') return Promise.all(expression.elements.map(evaluateExpression));
    if (expression.type === 'ObjectExpression') return Object.fromEntries(await Promise.all(expression.properties.map(async property => [property.key, await evaluateExpression(property.value)])));
    if (expression.type === 'Identifier') { if (!scope.has(expression.name)) throw runtimeError('Unknown variable: ' + expression.name); return scope.get(expression.name); }
    if (expression.type === 'MemberExpression') {
      const object = await evaluateExpression(expression.object);
      const value = object?.[expression.property];
      return typeof value === 'function' ? value.bind(object) : value;
    }
    if (expression.type === 'IndexExpression') {
      const object = await evaluateExpression(expression.object);
      const property = await evaluateExpression(expression.property);
      const value = object?.[property];
      return typeof value === 'function' ? value.bind(object) : value;
    }
    if (expression.type === 'CallExpression') { const callee = await evaluateExpression(expression.callee); if (typeof callee !== 'function') throw runtimeError('The expression is not callable.'); return callee(...await Promise.all(expression.arguments.map(evaluateExpression))); }
    throw runtimeError(`Unsupported expression: ${expression.type}`);
  };
}
