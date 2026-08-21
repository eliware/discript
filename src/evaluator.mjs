import { createScope } from './evaluator/scope.mjs';
import { normalizeError, runtimeError, ScriptExit } from './evaluator/errors.mjs';
import { ReturnSignal, createClosure } from './evaluator/functions.mjs';
import { createStatementEvaluator } from './evaluator/control-flow.mjs';
import { createExpressionEvaluator } from './evaluator/expressions.mjs';

export { ScriptExit } from './evaluator/errors.mjs';

export async function evaluate(program, globals = {}, { scope: sharedScope, baseDir = process.cwd() } = {}) {
  const { baseScope, context: scopeContext, scope } = createScope(globals, sharedScope);
  let evaluateStatement;
  let evaluateExpression;
  async function evaluateBlock(statements) { let result; for (const statement of statements) result = await evaluateStatement(statement); return result; }
  evaluateExpression = createExpressionEvaluator({ scope, scopeContext, evaluateBlock, evaluateExpression: expression => evaluateExpression(expression), normalizeError, runtimeError, ScriptExit });
  evaluateStatement = createStatementEvaluator({ scope, scopeContext, evaluateBlock, evaluateExpression: expression => evaluateExpression(expression), runtimeError, ReturnSignal, createClosure, baseDir });
  return scopeContext.run(baseScope, () => evaluateBlock(program.body));
}
