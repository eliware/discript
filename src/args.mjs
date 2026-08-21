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
    else if (token === '--rest') options.rest = true;
    else if (token === '--broker') options.broker = true;
    else if (token === '--direct') options.direct = true;
    else if (token === '--stdio') options.stdio = true;
    else if (token.startsWith('--')) {
      const [rawKey, inlineValue] = token.slice(2).split('=', 2);
      const parsedKey = rawKey.replaceAll('-', '_');
      const key = OPTION_ALIASES[parsedKey] ?? parsedKey;
      if (!KNOWN_OPTIONS.has(parsedKey) && !KNOWN_OPTIONS.has(key)) throw cliError(`Unknown option: --${rawKey}`, 'UNKNOWN_OPTION', 2);
      if (inlineValue !== undefined) options[key] = inlineValue;
      else if (VALUE_OPTIONS.has(key)) options[key] = requireValue(argv, ++index, `--${rawKey}`);
      else options[key] = true;
    } else {
      throw cliError(`Unknown option: ${token}`, 'INVALID_OPTION', 2);
    }
  }

  return { positionals, options };
}

const VALUE_OPTIONS = new Set(['eval', 'timeout', 'duration', 'start', 'reason', 'emoji', 'sticker', 'webhook', 'target', 'allow', 'deny', 'messages', 'invite', 'event', 'guild', 'channel', 'message', 'thread', 'user', 'role', 'content', 'name', 'description', 'topic', 'location', 'event_type', 'output', 'file', 'tags', 'type', 'category', 'parent', 'position', 'limit', 'mcp_port', 'tool', 'arguments', 'uri']);
const OPTION_ALIASES = Object.freeze({ guild_id: 'guild', channel_id: 'channel', message_id: 'message', thread_id: 'thread', user_id: 'user', role_id: 'role', webhook_id: 'webhook', event_id: 'event', sticker_id: 'sticker', emoji_id: 'emoji' });
const KNOWN_OPTIONS = new Set([...VALUE_OPTIONS, ...Object.keys(OPTION_ALIASES), 'help', 'version', 'json', 'jsonl', 'output', 'pretty', 'dry_run', 'validate', 'yes', 'rest', 'broker', 'direct', 'stdio', 'keep_alive']);

function requireValue(argv, index, option) {
  const value = argv[index];
  if (!value || value.startsWith('-')) throw cliError(`${option} requires a value`, 'MISSING_OPTION_VALUE', 2);
  return value;
}

export function cliError(message, code = 'DISCRIPT_ERROR', exitCode = 1) {
  return Object.assign(new Error(message), { code, exitCode });
}
