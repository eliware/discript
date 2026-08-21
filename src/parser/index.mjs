import { syntaxError } from './errors.mjs';
import { precedence } from './operators.mjs';
import { tokenize } from './tokenizer.mjs';
import { createTokenStream } from './tokens.mjs';
import { createExpressionParser } from './expressions.mjs';
import { createStatementParser } from './statements.mjs';

export { precedence } from './operators.mjs';

export function parse(source) {
  const stream = createTokenStream(tokenize(source));
  const { peek, match, atEnd, take } = stream;
  const syntaxErrorAt = message => syntaxError(message, peek());
  const consume = (type, message) => stream.consume(type, message, syntaxErrorAt);
  let parseBlock;
  const expressions = createExpressionParser({ peek, match, take, consume, syntaxError: syntaxErrorAt, precedence, parseBlock: () => parseBlock() });
  const statements = createStatementParser({ peek, match, take, consume, syntaxError: syntaxErrorAt, parseExpression: expressions.parseExpression, parseBlock: () => parseBlock() });
  parseBlock = () => {
    consume('{', 'Expected `{` to begin a block.');
    const body = [];
    while (!atEnd() && !match('}')) { if (match(';')) continue; body.push(statements()); match(';'); }
    if (stream.previous()?.value !== '}') throw syntaxErrorAt('Expected `}` to close the block.');
    return body;
  };
  const body = [];
  while (!atEnd()) { if (match(';')) continue; body.push(statements()); match(';'); }
  return { type: 'Program', body };
}
