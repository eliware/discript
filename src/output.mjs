export function writeResult(value, options = {}, stdout = console.log) {
  if (options.json || options.pretty) {
    stdout(JSON.stringify(value, null, 2));
    return;
  }
  if (typeof value === 'string') stdout(value);
  else if (Array.isArray(value)) value.forEach(item => stdout(formatItem(item)));
  else stdout(formatItem(value));
}

function formatItem(value) {
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}
