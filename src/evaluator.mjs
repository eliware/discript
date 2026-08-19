export async function evaluate(program, globals = {}) {
  const scope = new Map(Object.entries(globals));
  let result;
  for (const statement of program.body) {
    result = await evaluateStatement(statement);
  }
  return result;

  async function evaluateStatement(statement) {
    if (statement.type === 'Assignment') {
      const value = await evaluateExpression(statement.value);
      scope.set(statement.name, value);
      return value;
    }
    if (statement.type === 'ExpressionStatement') return evaluateExpression(statement.expression);
    if (statement.type === 'IfStatement') {
      const branch = await evaluateExpression(statement.test) ? statement.consequent : statement.alternate;
      let branchResult;
      for (const nested of branch ?? []) branchResult = await evaluateStatement(nested);
      return branchResult;
    }
    if (statement.type === 'WhileStatement') {
      let iterations = 0;
      let loopResult;
      while (await evaluateExpression(statement.test)) {
        if (++iterations > 10000) throw Object.assign(new Error('Loop exceeded the 10000 iteration limit.'), { code: 'LOOP_LIMIT', exitCode: 1 });
        for (const nested of statement.body) loopResult = await evaluateStatement(nested);
      }
      return loopResult;
    }
    throw runtimeError(`Unsupported statement: ${statement.type}`);
  }

  async function evaluateExpression(expression) {
    if (expression.type === 'Literal') return expression.value;
    if (expression.type === 'BinaryExpression') {
      const left = await evaluateExpression(expression.left);
      const right = await evaluateExpression(expression.right);
      if (expression.operator === '==') return left === right;
      if (expression.operator === '!=') return left !== right;
      if (expression.operator === '>') return left > right;
      if (expression.operator === '<') return left < right;
      if (expression.operator === '>=') return left >= right;
      if (expression.operator === '<=') return left <= right;
      if (expression.operator === '+') return left + right;
      if (expression.operator === '-') return left - right;
      if (expression.operator === '*') return left * right;
      if (expression.operator === '/') return left / right;
      throw runtimeError(`Unsupported operator: ${expression.operator}`);
    }
    if (expression.type === 'ArrayExpression') return Promise.all(expression.elements.map(evaluateExpression));
    if (expression.type === 'ObjectExpression') {
      const values = await Promise.all(expression.properties.map(async property => [property.key, await evaluateExpression(property.value)]));
      return Object.fromEntries(values);
    }
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
