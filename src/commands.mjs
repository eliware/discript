export const COMMANDS = [
  'bot get', 'guilds list', 'guilds get', 'members list', 'members get', 'roles list', 'roles get', 'roles create', 'roles update', 'roles delete', 'roles add', 'roles remove',
  'emojis list', 'emojis get', 'emojis create', 'emojis update', 'emojis delete', 'stickers list', 'stickers get', 'stickers create', 'stickers update', 'stickers delete', 'invites list', 'invites create', 'invites delete',
  'events list', 'events create', 'events update', 'events delete', 'voice status', 'voice join', 'voice leave',
  'channels list', 'channels get', 'channels create', 'channels delete', 'threads list', 'threads create', 'threads archive',
  'webhooks list', 'webhooks create', 'webhooks delete',
  'messages send', 'messages get', 'messages edit', 'messages delete', 'messages react', 'messages pin', 'messages unpin', 'messages bulk-delete',
  'moderation ban', 'moderation kick', 'moderation timeout',
];

const ALIASES = new Map([
  ['guild', 'guilds'], ['member', 'members'], ['role', 'roles'], ['chan', 'channels'], ['channel', 'channels'],
  ['msg', 'messages'], ['message', 'messages'], ['event', 'events'], ['invite', 'invites'], ['emoji', 'emojis'],
]);

export function normalizeCommand(command = []) {
  return command.map((part, index) => index === 0 ? ALIASES.get(part) ?? part : part);
}

export function commandCatalog() {
  return COMMANDS.map(name => ({ name, aliases: [ALIASES.get(name.split(' ')[0]) ? name.replace(name.split(' ')[0], Object.keys(Object.fromEntries(ALIASES)).find(alias => ALIASES.get(alias) === name.split(' ')[0]) ?? '') : ''].filter(Boolean) }));
}

export function suggestCommands(input, limit = 3) {
  const query = String(input).toLowerCase();
  return COMMANDS
    .map(name => ({ name, distance: editDistance(query, name) }))
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .filter(candidate => candidate.distance <= Math.max(3, Math.ceil(query.length / 3)))
    .slice(0, limit)
    .map(candidate => candidate.name);
}

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = left[i - 1] === right[j - 1] ? diagonal : 1 + Math.min(diagonal, row[j - 1], above);
      diagonal = above;
    }
  }
  return row[right.length];
}

export function completionScript(shell = 'bash') {
  const commands = COMMANDS.map(command => command.replace(' ', '\\ ')).join(' ');
  if (shell === 'bash') return `_discript_complete() { COMPREPLY=( $(compgen -W "${commands}" -- "${'${COMP_WORDS[COMP_CWORD]}'}") ); }; complete -F _discript_complete discript`;
  if (shell === 'zsh') return `#compdef discript\n_arguments '1:command:(${COMMANDS.join(' ')})'`;
  if (shell === 'fish') return COMMANDS.map(command => `complete -c discript -f -a '${command}'`).join('\n');
  throw Object.assign(new Error(`Unsupported shell: ${shell}`), { code: 'UNSUPPORTED_SHELL', exitCode: 2 });
}
