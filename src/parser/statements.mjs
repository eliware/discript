export function createStatementParser({ peek, match, take, consume, parseExpression, parseBlock, syntaxError }) {
  return function parseStatement() {
    if (peek()?.type === 'identifier' && peek().value === 'import') {
      take();
      return { type: 'ImportStatement', path: consume('string', 'Expected a source path after `import`.').value };
    }
    if (peek()?.type === 'identifier' && peek().value === 'fn') {
      take();
      const name = consume('identifier', 'Expected a function name after `fn`.');
      consume('(', 'Expected `(` after the function name.');
      const parameters = [];
      if (!match(')')) {
        do parameters.push(consume('identifier', 'Expected a function parameter.').value); while (match(','));
        consume(')', 'Expected `)` after function parameters.');
      }
      return { type: 'FunctionDeclaration', name: name.value, parameters, body: parseBlock() };
    }
    if (peek()?.type === 'identifier' && peek().value === 'return') {
      take();
      return { type: 'ReturnStatement', value: peek()?.value === ';' || peek()?.value === '}' ? null : parseExpression() };
    }
    if (peek()?.type === 'identifier' && (peek().value === 'break' || peek().value === 'continue')) {
      return { type: peek().value === 'break' ? 'BreakStatement' : 'ContinueStatement', keyword: take().value };
    }
    if (peek()?.type === 'identifier' && peek().value === 'throw') {
      take();
      return { type: 'ThrowStatement', value: parseExpression() };
    }
    if (peek()?.type === 'identifier' && peek().value === 'on') {
      take(); consume('(', 'Expected `(` after `on`.');
      const event = consume('string', 'Expected an event name after `on(`.');
      consume(')', 'Expected `)` after the event name.');
      return { type: 'EventStatement', event: event.value, body: parseBlock() };
    }
    if (peek()?.type === 'identifier' && (peek().value === 'every' || peek().value === 'after')) {
      const keyword = peek().value; take();
      consume('(', `Expected \`(\` after \`${keyword}\`.`);
      const delay = parseExpression(); consume(')', `Expected \`)\` after the \`${keyword}\` delay.`);
      return { type: keyword === 'every' ? 'EveryStatement' : 'AfterStatement', delay, body: parseBlock() };
    }
    if (peek()?.type === 'identifier' && peek().value === 'for') {
      take(); consume('(', 'Expected `(` after `for`.');
      const binding = consume('identifier', 'Expected a loop variable after `for(`.');
      if (peek()?.type !== 'identifier' || peek().value !== 'in') throw syntaxError('Expected `in` after the loop variable.');
      take(); const iterable = parseExpression(); consume(')', 'Expected `)` after the `for` collection.');
      return { type: 'ForInStatement', binding: binding.value, iterable, body: parseBlock() };
    }
    if (peek()?.type === 'identifier' && (peek().value === 'if' || peek().value === 'while')) {
      const keyword = peek().value; take();
      consume('(', 'Expected `(` after `if`.'); const test = parseExpression(); consume(')', 'Expected `)` after the `if` condition.');
      const consequent = parseBlock();
      if (keyword === 'while') return { type: 'WhileStatement', test, body: consequent };
      let alternate = null;
      if (peek()?.type === 'identifier' && peek().value === 'else') { take(); alternate = peek()?.type === 'identifier' && peek().value === 'if' ? parseStatement() : parseBlock(); }
      return { type: 'IfStatement', test, consequent, alternate };
    }
    const expression = parseExpression();
    if (match('=')) {
      if (expression.type === 'Identifier') return { type: 'Assignment', name: expression.name, value: parseExpression() };
      if (expression.type === 'MemberExpression' || expression.type === 'IndexExpression') return { type: 'Assignment', target: expression, value: parseExpression() };
      throw syntaxError('Only variables, members, and indexes can be assignment targets.');
    }
    return { type: 'ExpressionStatement', expression };
  };
}
