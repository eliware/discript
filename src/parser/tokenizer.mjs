import { syntaxError } from './errors.mjs';

const TOKEN_RE = /\s+|\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|(=>|\*\*|\?\?|\+=|-=|\*=|\/=|%=|==|!=|>=|<=|&&|\|\||>|<|\+|-|\*|\/|%|!)|([()[\].,;=:{}`])/y;

export function tokenize(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    TOKEN_RE.lastIndex = index;
    const match = TOKEN_RE.exec(source);
    if (!match) throw syntaxError(`Unexpected input near: ${source.slice(index, index + 20)}`, locationAt(source, index));
    const start = index;
    index = TOKEN_RE.lastIndex;
    if (match[0].trim() === '' || match[0].startsWith('//') || match[0].startsWith('#') || match[0].startsWith('/*')) continue;
    const token = { location: { ...locationAt(source, start), endOffset: index } };
    if (match[1]) tokens.push({ type: 'string', value: JSON.parse(match[1][0] === '"' ? match[1] : `"${match[1].slice(1, -1)}"`), ...token });
    else if (match[2]) tokens.push({ type: 'number', value: Number(match[2]), ...token });
    else if (match[3]) tokens.push({ type: 'identifier', value: match[3], ...token });
    else if (match[4]) tokens.push({ type: 'operator', value: match[4], ...token });
    else tokens.push({ type: match[5], value: match[5], ...token });
  }
  return tokens;
}

function locationAt(source, offset) {
  const before = source.slice(0, offset);
  const line = (before.match(/\n/g) ?? []).length + 1;
  const lastNewline = before.lastIndexOf('\n');
  return { line, column: offset - lastNewline, offset };
}
