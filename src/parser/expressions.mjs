export function createExpressionParser({ peek, match, take, consume, syntaxError, precedence, parseBlock }) {
  function parseExpression() {
    let expression = parseBinary(0);
    if (match('?')) {
      const consequent = parseExpression();
      consume(':', 'Expected `:` after the conditional expression.');
      expression = { type: 'ConditionalExpression', test: expression, consequent, alternate: parseExpression() };
    }
    return expression;
  }
  function parseBinary(minPrecedence) {
    let expression = parsePostfix();
    while (peek()?.type === 'operator' && precedence(peek().value) >= minPrecedence) {
      const operator = take().value;
      const right = parseBinary(precedence(operator) + 1);
      expression = { type: 'BinaryExpression', operator, left: expression, right };
    }
    return expression;
  }
  function parsePostfix() {
    let expression = parsePrimary();
    while (true) {
      if (match('.')) {
        const property = consume('identifier', 'Expected a property name after `.`');
        expression = { type: 'MemberExpression', object: expression, property: property.value };
        continue;
      }
      if (match('?.')) {
        if (match('(')) expression = { type: 'CallExpression', callee: expression, optional: true, arguments: parseArguments() };
        else if (match('[')) {
          const property = parseExpression();
          consume(']', 'Expected `]` after the optional index expression.');
          expression = { type: 'IndexExpression', object: expression, property, optional: true };
        } else {
          const property = consume('identifier', 'Expected a property name after `?.`');
          expression = { type: 'MemberExpression', object: expression, property: property.value, optional: true };
        }
        continue;
      }
      if (match('[')) {
        const property = parseExpression();
        consume(']', 'Expected `]` after the index expression.');
        expression = { type: 'IndexExpression', object: expression, property };
        continue;
      }
      if (match('(')) {
        expression = { type: 'CallExpression', callee: expression, arguments: parseArguments() };
        continue;
      }
      break;
    }
    if (match('=>')) {
      if (expression.type !== 'Identifier') throw syntaxError('Arrow callbacks require a single parameter name.');
      const body = peek()?.value === '{' ? { type: 'BlockBody', body: parseBlock() } : { type: 'ExpressionBody', body: parseExpression() };
      expression = { type: 'ArrowExpression', parameter: expression.name, body };
    }
    return expression;
  }
  function parseArguments() {
    const args = [];
    if (!match(')')) { do args.push(parseExpression()); while (match(',')); consume(')', 'Expected `)` after arguments.'); }
    return args;
  }
  function parsePrimary() {
    const token = peek();
    if (token?.type === 'operator' && (token.value === '!' || token.value === '-')) { take(); return { type: 'UnaryExpression', operator: token.value, argument: parsePrimary() }; }
    if (match('(')) { const expression = parseExpression(); consume(')', 'Expected `)` after grouped expression.'); return expression; }
    if (token?.type === 'identifier' && token.value === 'await') { take(); return { type: 'AwaitExpression', argument: parsePostfix() }; }
    if (token?.type === 'identifier' && token.value === 'try') {
      take(); const body = parseBlock();
      if (peek()?.type !== 'identifier' || peek().value !== 'catch') throw syntaxError('Expected `catch` after `try` block.');
      take(); consume('(', 'Expected `(` after `catch`.'); const binding = consume('identifier', 'Expected a catch variable.'); consume(')', 'Expected `)` after catch variable.');
      const handler = parseBlock();
      const finalizer = peek()?.type === 'identifier' && peek().value === 'finally' ? (take(), parseBlock()) : null;
      return { type: 'TryExpression', body, binding: binding.value, handler, finalizer };
    }
    if (token?.type === 'string' || token?.type === 'number') { take(); return { type: 'Literal', value: token.value }; }
    if (token?.type === 'identifier') { take(); if (token.value === 'true' || token.value === 'false') return { type: 'Literal', value: token.value === 'true' }; if (token.value === 'null') return { type: 'Literal', value: null }; return { type: 'Identifier', name: token.value }; }
    if (match('[')) {
      const elements = [];
      if (!match(']')) {
        do elements.push(match('...') ? { type: 'SpreadElement', argument: parseExpression() } : parseExpression()); while (match(','));
        consume(']', 'Expected `]` after array elements.');
      }
      return { type: 'ArrayExpression', elements };
    }
    if (match('{')) {
      const properties = [];
      if (!match('}')) {
        do {
          if (match('...')) properties.push({ type: 'SpreadProperty', argument: parseExpression() });
          else {
            const key = consume('identifier', 'Expected an object property name.');
            const value = match(':') ? parseExpression() : { type: 'Identifier', name: key.value };
            properties.push({ type: 'Property', key: key.value, value });
          }
        } while (match(','));
        consume('}', 'Expected `}` after object properties.');
      }
      return { type: 'ObjectExpression', properties };
    }
    throw syntaxError('Expected an expression.');
  }
  return { parseExpression, parseBinary };
}
