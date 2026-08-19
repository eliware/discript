import { required } from './validation.mjs';
export function createMembersHandler({ command, options, api }) {
  if (command[0] !== 'members' || !['list', 'get'].includes(command[1])) return { handled: false };
  const guild = required(options, 'guild', `members ${command[1]} requires --guild <id>.`, 'GUILD_REQUIRED');
  const base = api.guilds.get(guild).members;
  if (command[1] === 'list') return { handled: true, value: base.list() };
  return { handled: true, value: base.get(required(options, 'user', 'members get requires --user <id>.', 'USER_REQUIRED')) };
}
