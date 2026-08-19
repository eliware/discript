import { required } from './validation.mjs';
export function createGuildsHandler({ command, options, api }) {
  if (command.join(' ') === 'guilds list') return { handled: true, value: api.guilds.list() };
  if (command[0] !== 'guilds' || command[1] !== 'get') return { handled: false };
  const guild = required(options, 'guild', 'guilds get requires --guild <id>.', 'GUILD_REQUIRED');
  const value = api.guilds.get(guild); return { handled: true, value: { id: value.id, name: value.name } };
}
