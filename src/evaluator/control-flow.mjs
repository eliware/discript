import { BreakSignal, ContinueSignal, ScriptThrow } from './errors.mjs';

export function createStatementEvaluator({ scope, scopeContext, evaluateBlock, evaluateExpression, runtimeError, ReturnSignal, createClosure, baseDir }) {
  return async function evaluateStatement(statement) {
    if (statement.type === 'FunctionDeclaration') {
      const closure = createClosure(statement, { scope, scopeContext, evaluateBlock });
      scope.set(statement.name, closure); return closure;
    }
    if (statement.type === 'ImportStatement') {
      const load = scope.get('importScript');
      if (typeof load !== 'function') throw runtimeError('Script imports are unavailable in this execution mode.');
      const imported = await load(statement.path, scope, baseDir);
      if (statement.alias) scope.set(statement.alias, imported);
      return imported;
    }
    if (statement.type === 'ExportStatement') {
      const value = await evaluateStatement(statement.declaration);
      const exports = scope.get('exports');
      if (!exports || typeof exports !== 'object') throw runtimeError('Exports are unavailable in this execution mode.');
      const name = statement.declaration.name ?? statement.declaration.target?.name;
      if (!name) throw runtimeError('Only named declarations can be exported.');
      exports[name] = await evaluateExpression({ type: 'Identifier', name });
      return value;
    }
    if (statement.type === 'ReturnStatement') throw new ReturnSignal(statement.value === null ? undefined : await evaluateExpression(statement.value));
    if (statement.type === 'BreakStatement') throw new BreakSignal();
    if (statement.type === 'ContinueStatement') throw new ContinueSignal();
    if (statement.type === 'ThrowStatement') throw new ScriptThrow(await evaluateExpression(statement.value));
    if (statement.type === 'DeferStatement') {
      const defer = scope.get('defer');
      if (typeof defer !== 'function') throw runtimeError('Deferred cleanup is unavailable in this execution mode.');
      return defer(await evaluateExpression(statement.value));
    }
    if (statement.type === 'Assignment') {
      const value = await evaluateExpression(statement.value);
      const operator = statement.operator ?? '=';
      if (operator === '=') {
        if (statement.name) scope.set(statement.name, value);
        else await assignTarget(statement.target, value);
      } else {
        const current = statement.name ? await evaluateExpression({ type: 'Identifier', name: statement.name }) : await evaluateExpression(statement.target);
        await assignTarget(statement.name ? { type: 'IdentifierTarget', name: statement.name } : statement.target, applyAssignmentOperator(operator, current, value));
        return statement.name ? await evaluateExpression({ type: 'Identifier', name: statement.name }) : evaluateExpression(statement.target);
      }
      return value;
    }
    if (statement.type === 'DestructuringAssignment') {
      const value = await evaluateExpression(statement.value);
      await assignPattern(statement.pattern, value);
      return value;
    }
    if (statement.type === 'ExpressionStatement') return evaluateExpression(statement.expression);
    if (statement.type === 'EventStatement') {
      const register = scope.get('on');
      if (typeof register !== 'function') throw runtimeError('Event handlers are unavailable in this execution mode.');
      return register(statement.event, async payload => { scope.set('event', payload); return evaluateBlock(statement.body); });
    }
    if (statement.type === 'EveryStatement' || statement.type === 'AfterStatement') {
      const register = scope.get(statement.type === 'EveryStatement' ? 'every' : 'after');
      if (typeof register !== 'function') throw runtimeError('Timer declarations are unavailable in this execution mode.');
      const delay = await evaluateExpression(statement.delay); return register(delay, async () => evaluateBlock(statement.body));
    }
    if (statement.type === 'IfStatement') {
      const branch = await evaluateExpression(statement.test) ? statement.consequent : statement.alternate;
      if (branch?.type === 'IfStatement') return evaluateStatement(branch);
      let result; for (const nested of branch ?? []) result = await evaluateStatement(nested); return result;
    }
    if (statement.type === 'WhileStatement') {
      let iterations = 0; let result;
      while (await evaluateExpression(statement.test)) {
        if (++iterations > 10000) throw Object.assign(new Error('Loop exceeded the 10000 iteration limit.'), { code: 'LOOP_LIMIT', exitCode: 1 });
        try { for (const nested of statement.body) result = await evaluateStatement(nested); }
        catch (error) { if (error instanceof BreakSignal) break; if (error instanceof ContinueSignal) continue; throw error; }
      }
      return result;
    }
    if (statement.type === 'ForInStatement') {
      const iterable = await evaluateExpression(statement.iterable);
      const values = Array.isArray(iterable) ? iterable : iterable?.values ? [...iterable.values()] : iterable && typeof iterable === 'object' ? Object.values(iterable) : null;
      if (!values) throw runtimeError('The `for` collection must be an array or object.');
      if (values.length > 10000) throw Object.assign(new Error('Loop exceeded the 10000 item limit.'), { code: 'LOOP_LIMIT', exitCode: 1 });
      let result; for (const value of values) {
        scope.set(statement.binding, value);
        try { for (const nested of statement.body) result = await evaluateStatement(nested); }
        catch (error) { if (error instanceof BreakSignal) break; if (error instanceof ContinueSignal) continue; throw error; }
      } return result;
    }
    throw runtimeError(`Unsupported statement: ${statement.type}`);
  };

  async function assignTarget(target, value) {
    if (target.type === 'IdentifierTarget') { scope.set(target.name, value); return; }
    const object = await evaluateExpression(target.object);
    if (object === null || object === undefined) throw runtimeError('Cannot assign a property on a null value.');
    const property = target.type === 'IndexExpression' ? await evaluateExpression(target.property) : target.property;
    object[property] = value;
  }

  async function assignPattern(pattern, value) {
    if (pattern.type === 'Identifier') { scope.set(pattern.name, value); return; }
    if (pattern.type === 'ArrayExpression') {
      const values = Array.isArray(value) ? value : value && typeof value[Symbol.iterator] === 'function' ? [...value] : null;
      if (!values) throw runtimeError('Array destructuring expects an iterable value.');
      let index = 0;
      for (const element of pattern.elements) {
        if (element.type === 'SpreadElement') { await assignPattern(element.argument, values.slice(index)); index = values.length; }
        else { await assignPattern(element, values[index]); index += 1; }
      }
      return;
    }
    if (pattern.type === 'ObjectExpression') {
      if (value === null || typeof value !== 'object') throw runtimeError('Object destructuring expects an object value.');
      const consumed = new Set();
      for (const property of pattern.properties) {
        if (property.type === 'SpreadProperty') {
          const rest = Object.fromEntries(Object.entries(value).filter(([key]) => !consumed.has(key)));
          await assignPattern(property.argument, rest);
        } else {
          consumed.add(property.key);
          await assignPattern(property.value, value[property.key]);
        }
      }
      return;
    }
    throw runtimeError('Invalid destructuring pattern.');
  }

  function applyAssignmentOperator(operator, left, right) {
    if (operator === '+=') return left + right;
    if (operator === '-=') return left - right;
    if (operator === '*=') return left * right;
    if (operator === '/=') return left / right;
    if (operator === '%=') return left % right;
    throw runtimeError(`Unsupported assignment operator: ${operator}`);
  }
}
