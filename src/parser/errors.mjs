export function syntaxError(message) {
  return Object.assign(new Error(message), { code: 'PARSE_ERROR', exitCode: 3 });
}
