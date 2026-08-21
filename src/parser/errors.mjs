export function syntaxError(message, tokenOrLocation = null) {
  const location = tokenOrLocation?.location ?? tokenOrLocation;
  return Object.assign(new Error(location ? `${message} at ${location.line}:${location.column}.` : message), {
    code: 'PARSE_ERROR',
    exitCode: 3,
    ...(location ? { details: { line: location.line, column: location.column, ...(location.offset !== undefined ? { offset: location.offset } : {}) } } : {}),
  });
}
