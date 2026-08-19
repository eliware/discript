export function createTokenStream(tokens) {
  let index = 0;
  return {
    peek: () => tokens[index],
    match(type) {
      if (tokens[index]?.value === type || tokens[index]?.type === type) { index += 1; return true; }
      return false;
    },
    consume(type, message, syntaxError) {
      if (!this.match(type)) throw syntaxError(message);
      return tokens[index - 1];
    },
    atEnd: () => index >= tokens.length,
    previous: () => tokens[index - 1],
    take: () => tokens[index++],
    takeValue: () => tokens[index++]?.value,
  };
}
