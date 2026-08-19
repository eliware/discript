export async function evaluate(program, globals = {}, { scope: sharedScope, baseDir = process.cwd() } = {}) {
  const scope = sharedScope ?? new Map(Object.entries(globals));
  return evaluateBlock(program.body);

  async function evaluateBlock(statements) {
    let result;
    for (const statement of statements) result = await evaluateStatement(statement);
    return result;
  }

  async function evaluateStatement(statement) {
    if (statement.type === 'FunctionDeclaration') {
      const closure = async (...values) => {
        const previous = new Map();
        for (const [index, parameter] of statement.parameters.entries()) {
          previous.set(parameter, { exists: scope.has(parameter), value: scope.get(parameter) });
          scope.set(parameter, values[index]);
        }
        try { return await evaluateBlock(statement.body); }
        catch (error) {
          if (error instanceof ReturnSignal) return error.value;
          throw error;
        } finally {
          for (const [parameter, state] of previous) {
            if (state.exists) scope.set(parameter, state.value);
            else scope.delete(parameter);
          }
        }
      };
      scope.set(statement.name, closure);
      return closure;
    }
    if (statement.type === 'ImportStatement') {
      const load = scope.get('importScript');
      if (typeof load !== 'function') throw runtimeError('Script imports are unavailable in this execution mode.');
      return load(statement.path, scope, baseDir);
    }
    if (statement.type === 'ReturnStatement') throw new ReturnSignal(statement.value === null ? undefined : await evaluateExpression(statement.value));
    if (statement.type === 'Assignment') {
      const value = await evaluateExpression(statement.value);
      scope.set(statement.name, value);
      return value;
    }
    if (statement.type === 'ExpressionStatement') return evaluateExpression(statement.expression);
    if (statement.type === 'EventStatement') {
      const register = scope.get('on');
      if (typeof register !== 'function') throw runtimeError('Event handlers are unavailable in this execution mode.');
      return register(statement.event, async payload => {
        scope.set('event', payload);
        return evaluateBlock(statement.body);
      });
    }
    if (statement.type === 'EveryStatement' || statement.type === 'AfterStatement') {
      const register = scope.get(statement.type === 'EveryStatement' ? 'every' : 'after');
      if (typeof register !== 'function') throw runtimeError('Timer declarations are unavailable in this execution mode.');
      const delay = await evaluateExpression(statement.delay);
      return register(delay, async () => evaluateBlock(statement.body));
    }
    if (statement.type === 'IfStatement') {
      const branch = await evaluateExpression(statement.test) ? statement.consequent : statement.alternate;
      if (branch?.type === 'IfStatement') return evaluateStatement(branch);
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
    if (statement.type === 'ForInStatement') {
      const iterable = await evaluateExpression(statement.iterable);
      const values = Array.isArray(iterable) ? iterable : iterable?.values ? [...iterable.values()] : iterable && typeof iterable === 'object' ? Object.values(iterable) : null;
      if (!values) throw runtimeError('The `for` collection must be an array or object.');
      if (values.length > 10000) throw Object.assign(new Error('Loop exceeded the 10000 item limit.'), { code: 'LOOP_LIMIT', exitCode: 1 });
      let loopResult;
      for (const value of values) {
        scope.set(statement.binding, value);
        for (const nested of statement.body) loopResult = await evaluateStatement(nested);
      }
      return loopResult;
    }
    throw runtimeError(`Unsupported statement: ${statement.type}`);
  }

  async function evaluateExpression(expression) {
    if (expression.type === 'Literal') return expression.value;
    if (expression.type === 'AwaitExpression') return evaluateExpression(expression.argument);
    if (expression.type === 'UnaryExpression') {
      const value = await evaluateExpression(expression.argument);
      if (expression.operator === '!') return !value;
      if (expression.operator === '-') return -value;
      throw runtimeError(`Unsupported unary operator: ${expression.operator}`);
    }
    if (expression.type === 'ArrowExpression') {
      return async value => {
        const hadPrevious = scope.has(expression.parameter);
        const previous = scope.get(expression.parameter);
        scope.set(expression.parameter, value);
        try {
          if (expression.body.type === 'ExpressionBody') return evaluateExpression(expression.body.body);
          return evaluateBlock(expression.body.body);
        } finally {
          if (hadPrevious) scope.set(expression.parameter, previous);
          else scope.delete(expression.parameter);
        }
      };
    }
    if (expression.type === 'TryExpression') {
      try {
        const value = await evaluateBlock(expression.body);
        return { ok: true, exitCode: 0, value };
      } catch (error) {
        if (error instanceof ScriptExit) throw error;
        scope.set(expression.binding, normalizeError(error));
        await evaluateBlock(expression.handler);
        return { ok: false, exitCode: error?.exitCode ?? 1, error: normalizeError(error) };
      }
    }
    if (expression.type === 'BinaryExpression') {
      const left = await evaluateExpression(expression.left);
      if (expression.operator === '&&') return left && await evaluateExpression(expression.right);
      if (expression.operator === '||') return left || await evaluateExpression(expression.right);
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

class ReturnSignal {
  constructor(value) { this.value = value; }
}

function normalizeError(error) {
  return { code: error?.code ?? 'DISCRIPT_ERROR', message: error?.message ?? String(error), exitCode: error?.exitCode ?? 1 };
}

export class ScriptExit extends Error {
  constructor(exitCode = 0, message = null) {
    super(message ?? `Script exited with status ${exitCode}.`);
    this.name = 'ScriptExit';
    this.code = 'SCRIPT_EXIT';
    this.exitCode = Number(exitCode);
    this.details = message ? { message } : undefined;
  }
}
