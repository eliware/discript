export function createGuildRolesApi({ guild, dryRun, mapCache, requireApproval, requirePermission, requireManageableRole }) {
  return {
            list: () => mapCache(guild.roles.cache, role => ({ id: role.id, name: role.name, position: role.position, managed: role.managed })),
            create: async (name, operationOptions = {}) => {
              requirePermission(guild, 'ManageRoles');
              requireApproval('Creating a role', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, name, created: true };
              const role = await guild.roles.create({ name: String(name) });
              return { id: role.id, name: role.name, created: true };
            },
            get: id => {
              const role = guild.roles.cache.get(String(id));
              if (!role) throw Object.assign(new Error(`Role not found: ${id}`), { code: 'ROLE_NOT_FOUND', exitCode: 1 });
              return {
                id: role.id, name: role.name, position: role.position, managed: role.managed,
                update: async (settings = {}, operationOptions = {}) => {
                  requireManageableRole(guild, role.id);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Updating a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: role.id, settings };
                  const updated = await role.edit(settings);
                  return { id: updated.id, name: updated.name, updated: true };
                },
                delete: async (operationOptions = {}) => {
                  requireManageableRole(guild, role.id);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Deleting a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: role.id, deleted: true };
                  await role.delete();
                  return { id: role.id, deleted: true };
                },
              };
            },
          };
}
