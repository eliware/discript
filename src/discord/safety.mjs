export function createSafety({ client, dryRun, yes }) {
  const requireApproval = (action, operationOptions = {}) => {
    if (dryRun || operationOptions.dryRun === true) return;
    if (!yes && operationOptions.force !== true) throw Object.assign(new Error(`${action} requires --yes or force: true.`), { code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
  };
  const requirePermission = (guild, permission) => {
    const botMember = guild?.members?.me;
    if (Object.hasOwn(guild?.members ?? {}, 'me') && (!botMember?.permissions?.has || !botMember.permissions.has(permission))) throw Object.assign(new Error(`Bot lacks ${permission} permission.`), { code: 'MISSING_PERMISSION', exitCode: 5 });
  };
  const requireChannelPermission = (channelId, permission) => {
    const channel = client.channels.cache.get(String(channelId)); const botMember = channel?.guild?.members?.me;
    if (Object.hasOwn(channel?.guild?.members ?? {}, 'me') && (!botMember?.permissions?.has || !botMember.permissions.has(permission))) throw Object.assign(new Error(`Bot lacks ${permission} permission.`), { code: 'MISSING_PERMISSION', exitCode: 5 });
  };
  const requireManageableRole = (guild, roleId) => {
    const role = guild.roles.cache.get(String(roleId));
    if (role?.managed || role?.name === '@everyone') throw Object.assign(new Error('Managed and @everyone roles cannot be changed.'), { code: 'ROLE_PROTECTED', exitCode: 5 });
    const highest = guild.members?.me?.roles?.highest;
    if (highest?.position !== undefined && role?.position !== undefined && role.position >= highest.position) throw Object.assign(new Error('Bot role hierarchy prevents this role change.'), { code: 'ROLE_HIERARCHY', exitCode: 5 });
  };
  const requireManageableMember = (guild, member) => {
    if (member.user?.bot || member.id === guild.ownerId || member.id === guild.members?.me?.id) throw Object.assign(new Error('Bot, owner, and self targets cannot be moderated.'), { code: 'MEMBER_PROTECTED', exitCode: 5 });
    const highest = guild.members?.me?.roles?.highest; const targetHighest = member.roles?.highest;
    if (highest?.position !== undefined && targetHighest?.position !== undefined && targetHighest.position >= highest.position) throw Object.assign(new Error('Bot role hierarchy prevents this member moderation.'), { code: 'MEMBER_HIERARCHY', exitCode: 5 });
  };
  return { requireApproval, requirePermission, requireChannelPermission, requireManageableRole, requireManageableMember };
}
