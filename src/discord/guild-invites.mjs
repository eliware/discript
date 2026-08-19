export function createGuildInvitesApi({ guild, client, dryRun, mapCache, requireApproval, requirePermission }) {
  return {
            list: async () => {
              if (!guild.invites?.fetch) throw Object.assign(new Error('Invite listing is unavailable.'), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              const invites = await guild.invites.fetch();
              return mapCache(invites, invite => ({ code: invite.code, url: invite.url, uses: invite.uses ?? 0, channelId: invite.channelId ?? null }));
            },
            create: async (channelId, inviteOptions = {}, operationOptions = {}) => {
              const channel = guild.channels.cache.get(String(channelId));
              if (!channel?.createInvite) throw Object.assign(new Error(`Invite creation is unavailable for channel: ${channelId}`), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              requirePermission(guild, 'CreateInstantInvite');
              requireApproval('Creating an invite', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), options: inviteOptions };
              const invite = await channel.createInvite(inviteOptions);
              return { code: invite.code, url: invite.url, channelId: invite.channelId ?? String(channelId), created: true };
            },
            delete: async (code, operationOptions = {}) => {
              requirePermission(guild, 'ManageGuild');
              if (!client.invites?.delete) throw Object.assign(new Error('Invite deletion is unavailable.'), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              requireApproval('Deleting an invite', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, code: String(code), deleted: true };
              await client.invites.delete(String(code));
              return { code: String(code), deleted: true };
            },
          };
}
