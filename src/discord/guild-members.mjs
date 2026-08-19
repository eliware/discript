export function createGuildMembersApi({ guild, dryRun, mapCache, requireApproval, requirePermission, requireManageableRole, requireManageableMember }) {
  return {
            list: () => mapCache(guild.members.cache, member => ({ id: member.id, username: member.user?.username ?? null, displayName: member.displayName ?? null })),
            get: id => {
              const member = guild.members.cache.get(String(id));
              if (!member) throw Object.assign(new Error(`Member not found: ${id}`), { code: 'MEMBER_NOT_FOUND', exitCode: 1 });
              return {
                id: member.id,
                username: member.user?.username ?? null,
                displayName: member.displayName ?? null,
                roles: mapCache(member.roles?.cache, role => ({ id: role.id, name: role.name })),
                voice: {
                  status: () => ({ memberId: member.id, channelId: member.voice?.channelId ?? member.voice?.channel?.id ?? null, muted: member.voice?.serverMute ?? false, deafened: member.voice?.serverDeaf ?? false }),
                  mute: async (muted = true, operationOptions = {}) => {
                    requireManageableMember(guild, member);
                    requirePermission(guild, 'MuteMembers');
                    requireApproval(`${muted ? 'Muting' : 'Unmuting'} a member`, operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, muted: Boolean(muted) };
                    if (!member.voice?.setMute) throw Object.assign(new Error('Member voice controls are unavailable.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
                    await member.voice.setMute(Boolean(muted), operationOptions.reason);
                    return { memberId: member.id, muted: Boolean(muted) };
                  },
                  deafen: async (deafened = true, operationOptions = {}) => {
                    requireManageableMember(guild, member);
                    requirePermission(guild, 'DeafenMembers');
                    requireApproval(`${deafened ? 'Deafening' : 'Undeafening'} a member`, operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, deafened: Boolean(deafened) };
                    if (!member.voice?.setDeaf) throw Object.assign(new Error('Member voice controls are unavailable.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
                    await member.voice.setDeaf(Boolean(deafened), operationOptions.reason);
                    return { memberId: member.id, deafened: Boolean(deafened) };
                  },
                  disconnect: async (operationOptions = {}) => {
                    requireManageableMember(guild, member);
                    requirePermission(guild, 'MoveMembers');
                    requireApproval('Disconnecting a member from voice', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, disconnected: true };
                    if (!member.voice?.setChannel) throw Object.assign(new Error('Member voice controls are unavailable.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
                    await member.voice.setChannel(null, operationOptions.reason);
                    return { memberId: member.id, disconnected: true };
                  },
                  move: async (channelId, operationOptions = {}) => {
                    requireManageableMember(guild, member);
                    requirePermission(guild, 'MoveMembers');
                    const channel = guild.channels?.cache?.get(String(channelId));
                    if (!channel || (!channel.isVoiceBased?.() && !['voice', 'stage'].includes(channel.type))) throw Object.assign(new Error(`Voice channel not found: ${channelId}`), { code: 'VOICE_CHANNEL_REQUIRED', exitCode: 2 });
                    requireApproval('Moving a member to voice', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, channelId: String(channelId), moved: true };
                    if (!member.voice?.setChannel) throw Object.assign(new Error('Member voice controls are unavailable.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
                    await member.voice.setChannel(String(channelId), operationOptions.reason);
                    return { memberId: member.id, channelId: String(channelId), moved: true };
                  },
                },
                addRole: async (roleId, operationOptions = {}) => {
                  requireManageableRole(guild, roleId);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Adding a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), added: true };
                  await member.roles.add(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), added: true };
                },
                removeRole: async (roleId, operationOptions = {}) => {
                  requireManageableRole(guild, roleId);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Removing a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), removed: true };
                  await member.roles.remove(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), removed: true };
                },
                ban: async (reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'BanMembers');
                  requireApproval('Banning a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, banned: true, reason: reason ?? null };
                  await member.ban({ reason: reason ?? undefined });
                  return { memberId: member.id, banned: true };
                },
                kick: async (reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'KickMembers');
                  requireApproval('Kicking a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, kicked: true, reason: reason ?? null };
                  await member.kick(reason ?? undefined);
                  return { memberId: member.id, kicked: true };
                },
                timeout: async (durationMs, reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'ModerateMembers');
                  requireApproval('Timing out a member', operationOptions);
                  if (!Number.isInteger(Number(durationMs)) || Number(durationMs) < 1) throw Object.assign(new Error('Timeout duration must be a positive number of milliseconds.'), { code: 'INVALID_DURATION', exitCode: 2 });
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, timeoutMs: Number(durationMs), reason: reason ?? null };
                  await member.timeout(Number(durationMs), reason ?? undefined);
                  return { memberId: member.id, timeoutMs: Number(durationMs), timedOut: true };
                },
              };
            },
          };
}
