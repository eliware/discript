export async function evaluate(program, globals = {}) {
  const scope = new Map(Object.entries(globals));
  let result;
  for (const statement of program.body) {
    if (statement.type === 'Assignment') {
      result = await evaluateExpression(statement.value);
      scope.set(statement.name, result);
    } else result = await evaluateExpression(statement.expression);
  }
  return result;

  async function evaluateExpression(expression) {
    if (expression.type === 'Literal') return expression.value;
    if (expression.type === 'Identifier') {
      if (!scope.has(expression.name)) throw runtimeError(`Unknown variable: ${expression.name}`);
      return scope.get(expression.name);
    }
    if (expression.type === 'MemberExpression') {
      const object = await evaluateExpression(expression.object);
      return object?.[expression.property];
    }
    if (expression.type === 'CallExpression') {
      const callee = await evaluateExpression(expression.callee);
      if (typeof callee !== 'function') throw runtimeError('The expression is not callable.');
      return callee(...await Promise.all(expression.arguments.map(evaluateExpression)));
    }
    throw runtimeError(`Unsupported expression: ${expression.type}`);
  }
}

function runtimeError(message) { return Object.assign(new Error(message), { code: 'RUNTIME_ERROR', exitCode: 1 }); }
