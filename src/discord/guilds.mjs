import { createGuildMembersApi } from './guild-members.mjs';
import { createGuildRolesApi } from './guild-roles.mjs';
import { createGuildEmojisApi } from './guild-emojis.mjs';
import { createGuildStickersApi } from './guild-stickers.mjs';
import { createGuildScheduledEventsApi } from './guild-scheduledEvents.mjs';
import { createGuildInvitesApi } from './guild-invites.mjs';
import { createGuildChannelsApi } from './guild-channels.mjs';

export function createGuildsApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission, settingsReason }) {
  return {
      list: () => client.guilds.cache.map(guild => ({ id: guild.id, name: guild.name })),
      get: id => {
        const guild = client.guilds.cache.get(String(id));
        if (!guild) throw Object.assign(new Error(`Guild not found: ${id}`), { code: 'GUILD_NOT_FOUND', exitCode: 1 });
        return {
          id: guild.id,
          name: guild.name,
          members: createGuildMembersApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          roles: createGuildRolesApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          emojis: createGuildEmojisApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          stickers: createGuildStickersApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          scheduledEvents: createGuildScheduledEventsApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          invites: createGuildInvitesApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
          channels: createGuildChannelsApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
        };
      },
    };
}
