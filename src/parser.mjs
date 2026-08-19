const TOKEN_RE = /\s+|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|(==|!=|>=|<=|>|<|\+|-|\*|\/)|([()[\].,;=:{}`])/y;

export function parse(source) {
  const tokens = tokenize(source);
  let index = 0;
  const body = [];

  while (!atEnd()) { if (match(';')) continue; body.push(parseStatement()); match(';'); }
  return { type: 'Program', body };

  function parseStatement() {
    if (peek()?.type === 'identifier' && peek().value === 'on') {
      index += 1;
      consume('(', 'Expected `(` after `on`.' ) ;
      const event = consume('string', 'Expected an event name after `on(`.');
      consume(')', 'Expected `)` after the event name.');
      return { type: 'EventStatement', event: event.value, body: parseBlock() };
    }
    if (peek()?.type === 'identifier' && (peek().value === 'if' || peek().value === 'while')) {
      const keyword = peek().value;
      index += 1;
      consume('(', 'Expected `(` after `if`.');
      const test = parseExpression();
      consume(')', 'Expected `)` after the `if` condition.');
      const consequent = parseBlock();
      if (keyword === 'while') return { type: 'WhileStatement', test, body: consequent };
      let alternate = null;
      if (peek()?.type === 'identifier' && peek().value === 'else') { index += 1; alternate = parseBlock(); }
      return { type: 'IfStatement', test, consequent, alternate };
    }
    const expression = parseExpression();
    if (expression.type === 'Identifier' && match('=')) return { type: 'Assignment', name: expression.name, value: parseExpression() };
    return { type: 'ExpressionStatement', expression };
  }

  function parseBlock() {
    consume('{', 'Expected `{` to begin a block.');
    const statements = [];
    while (!atEnd() && !match('}')) { if (match(';')) continue; statements.push(parseStatement()); match(';'); }
    if (tokens[index - 1]?.value !== '}') throw syntaxError('Expected `}` to close the block.');
    return statements;
  }

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
    if (peek()?.type === 'operator') {
      const operator = tokens[index++].value;
      expression = { type: 'BinaryExpression', operator, left: expression, right: parseExpression() };
    }
    return expression;
  }

  function parsePrimary() {
    const token = peek();
    if (token?.type === 'identifier' && token.value === 'try') {
      index += 1;
      const body = parseBlock();
      if (peek()?.type !== 'identifier' || peek().value !== 'catch') throw syntaxError('Expected `catch` after `try` block.');
      index += 1;
      consume('(', 'Expected `(` after `catch`.');
      const binding = consume('identifier', 'Expected a catch variable.');
      consume(')', 'Expected `)` after catch variable.');
      return { type: 'TryExpression', body, binding: binding.value, handler: parseBlock() };
    }
    if (token?.type === 'string' || token?.type === 'number') { index += 1; return { type: 'Literal', value: token.value }; }
    if (token?.type === 'identifier') {
      index += 1;
      if (token.value === 'true' || token.value === 'false') return { type: 'Literal', value: token.value === 'true' };
      if (token.value === 'null') return { type: 'Literal', value: null };
      return { type: 'Identifier', name: token.value };
    }
    if (match('[')) {
      const elements = [];
      if (!match(']')) {
        do elements.push(parseExpression()); while (match(','));
        consume(']', 'Expected `]` after array elements.');
      }
      return { type: 'ArrayExpression', elements };
    }
    if (match('{')) {
      const properties = [];
      if (!match('}')) {
        do {
          const key = consume('identifier', 'Expected an object property name.');
          consume(':', 'Expected `:` after object property name.');
          properties.push({ key: key.value, value: parseExpression() });
        } while (match(','));
        consume('}', 'Expected `}` after object properties.');
      }
      return { type: 'ObjectExpression', properties };
    }
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
    else if (match[4]) tokens.push({ type: 'operator', value: match[4] });
    else tokens.push({ type: match[5], value: match[5] });
  }
  return tokens;
}

function syntaxError(message) { return Object.assign(new Error(message), { code: 'PARSE_ERROR', exitCode: 3 }); }
