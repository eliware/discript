import { required } from './validation.mjs';
export function createRolesHandler({ command, options, api }) {
  if (command[0] !== 'roles' || !['list','get','create','update','delete','add','remove'].includes(command[1])) return { handled: false };
  const guild = required(options, 'guild', `roles ${command[1]} requires --guild <id>.`, 'GUILD_REQUIRED'); const roles = api.guilds.get(guild).roles;
  if (command[1] === 'list') return { handled:true, value:roles.list() };
  if (command[1] === 'create') return { handled:true, value:roles.create(required(options,'name','roles create requires --name <name>.','NAME_REQUIRED')) };
  if (['add','remove'].includes(command[1])) { const member=api.guilds.get(guild).members.get(required(options,'user',`roles ${command[1]} requires --user <id>.`,'USER_REQUIRED')); const role=required(options,'role',`roles ${command[1]} requires --role <id>.`,'ROLE_REQUIRED'); return {handled:true,value:command[1]==='add'?member.addRole(role):member.removeRole(role)}; }
  const role=roles.get(required(options,'role',`roles ${command[1]} requires --role <id>.`,'ROLE_REQUIRED')); if(command[1]==='delete') return {handled:true,value:role.delete()}; return {handled:true,value:role.update({name:required(options,'name','roles update requires --name <name>.','NAME_REQUIRED')})};
}
