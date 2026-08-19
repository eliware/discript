export const COMMANDS = [
  'guilds list', 'guilds get', 'members list', 'members get', 'roles list', 'roles get', 'roles create', 'roles update', 'roles delete', 'roles add', 'roles remove',
  'emojis list', 'stickers list', 'invites list', 'invites create', 'invites delete',
  'events list', 'events create', 'events update', 'events delete', 'voice status', 'voice join', 'voice leave',
  'channels list', 'channels get', 'channels create', 'channels delete', 'threads list', 'threads create', 'threads archive',
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

export function completionScript(shell = 'bash') {
  const commands = COMMANDS.map(command => command.replace(' ', '\\ ')).join(' ');
  if (shell === 'bash') return `_discript_complete() { COMPREPLY=( $(compgen -W "${commands}" -- "${'${COMP_WORDS[COMP_CWORD]}'}") ); }; complete -F _discript_complete discript`;
  if (shell === 'zsh') return `#compdef discript\n_arguments '1:command:(${COMMANDS.join(' ')})'`;
  if (shell === 'fish') return COMMANDS.map(command => `complete -c discript -f -a '${command}'`).join('\n');
  throw Object.assign(new Error(`Unsupported shell: ${shell}`), { code: 'UNSUPPORTED_SHELL', exitCode: 2 });
}
