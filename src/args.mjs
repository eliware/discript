export function parseArgs(argv = []) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!token.startsWith('-') || token === '-') {
      positionals.push(token);
      continue;
    }
    if (token === '-h') options.help = true;
    else if (token === '-v') options.version = true;
    else if (token === '-e') options.eval = requireValue(argv, ++index, '-e');
    else if (token === '-y') options.yes = true;
    else if (token.startsWith('--')) {
      const [rawKey, inlineValue] = token.slice(2).split('=', 2);
      const key = rawKey.replaceAll('-', '_');
      if (inlineValue !== undefined) options[key] = inlineValue;
      else if (['eval', 'timeout', 'duration', 'start', 'reason', 'emoji', 'sticker', 'webhook', 'target', 'allow', 'deny', 'messages', 'invite', 'event', 'guild', 'channel', 'message', 'thread', 'user', 'role', 'content', 'name', 'description', 'topic', 'location', 'event_type', 'output', 'file', 'tags', 'type', 'category', 'parent', 'position', 'limit'].includes(key)) options[key] = requireValue(argv, ++index, `--${rawKey}`);
      else options[key] = true;
    } else {
      throw cliError(`Unknown option: ${token}`, 'INVALID_OPTION', 2);
    }
  }

  return { positionals, options };
}

function requireValue(argv, index, option) {
  const value = argv[index];
  if (!value || value.startsWith('-')) throw cliError(`${option} requires a value`, 'MISSING_OPTION_VALUE', 2);
  return value;
}

export function cliError(message, code = 'DISCRIPT_ERROR', exitCode = 1) {
  return Object.assign(new Error(message), { code, exitCode });
}
