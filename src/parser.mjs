const TOKEN_RE = /\s+|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|([().,;=])/y;

export function parse(source) {
  const tokens = tokenize(source);
  let index = 0;
  const body = [];

  while (!atEnd()) {
    if (match(';')) continue;
    const expression = parseExpression();
    if (expression.type === 'Identifier' && match('=')) {
      body.push({ type: 'Assignment', name: expression.name, value: parseExpression() });
    } else body.push({ type: 'ExpressionStatement', expression });
    match(';');
  }
  return { type: 'Program', body };

  function parseExpression() {
    let expression = parsePrimary();
    while (match('.')) {
      const property = consume('identifier', 'Expected a property name after `.`.');
      expression = { type: 'MemberExpression', object: expression, property: property.value };
      if (match('(')) {
        const args = [];
        if (!match(')')) {
          do args.push(parseExpression()); while (match(','));
          consume(')', 'Expected `)` after arguments.');
        }
        expression = { type: 'CallExpression', callee: expression, arguments: args };
      }
    }
    if (match('(')) {
      const args = [];
      if (!match(')')) {
        do args.push(parseExpression()); while (match(','));
        consume(')', 'Expected `)` after arguments.');
      }
      expression = { type: 'CallExpression', callee: expression, arguments: args };
    }
    return expression;
  }

  function parsePrimary() {
    const token = peek();
    if (token?.type === 'string' || token?.type === 'number') { index += 1; return { type: 'Literal', value: token.value }; }
    if (token?.type === 'identifier') { index += 1; return { type: 'Identifier', name: token.value }; }
    throw syntaxError('Expected an expression.');
  }

  function match(type) {
    if (peek()?.value === type || peek()?.type === type) { index += 1; return true; }
    return false;
  }
  function consume(type, message) { if (!match(type)) throw syntaxError(message); return tokens[index - 1]; }
  function peek() { return tokens[index]; }
  function atEnd() { return index >= tokens.length; }
}

function tokenize(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    TOKEN_RE.lastIndex = index;
    const match = TOKEN_RE.exec(source);
    if (!match) throw syntaxError(`Unexpected input near: ${source.slice(index, index + 20)}`);
    index = TOKEN_RE.lastIndex;
    if (match[0].trim() === '') continue;
    if (match[1]) tokens.push({ type: 'string', value: JSON.parse(match[1][0] === '"' ? match[1] : `"${match[1].slice(1, -1)}"`) });
    else if (match[2]) tokens.push({ type: 'number', value: Number(match[2]) });
    else if (match[3]) tokens.push({ type: 'identifier', value: match[3] });
    else tokens.push({ type: match[4], value: match[4] });
  }
  return tokens;
}

function syntaxError(message) { return Object.assign(new Error(message), { code: 'PARSE_ERROR', exitCode: 3 }); }
