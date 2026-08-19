export function required(options, key, message, code = `${key.toUpperCase()}_REQUIRED`) {
  if (options[key] === undefined || options[key] === '') throw Object.assign(new Error(message), { code, exitCode: 2 });
  return options[key];
}
export function option(options, key, message, code) { return required(options, key, message, code); }
export function handled(value) { return { handled: true, value }; }
export const unhandled = () => ({ handled: false });
