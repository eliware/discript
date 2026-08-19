import { createSafety } from './discord/safety.mjs';
import { createNormalization } from './discord/normalization.mjs';
import { createBotApi } from './discord/bot.mjs';
import { createVoiceApi } from './discord/voice.mjs';
import { createMessagesApi } from './discord/messages.mjs';
import { createChannelsApi } from './discord/channels.mjs';
import { createGuildsApi } from './discord/guilds.mjs';

export function createDiscordApi(client, { yes = false, dryRun = false, voiceModule = null } = {}) {
  let loadedVoiceModule = voiceModule;
  const loadVoiceModule = async () => {
    if (!loadedVoiceModule) loadedVoiceModule = await import('@discordjs/voice');
    return loadedVoiceModule;
  };
  const { mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite } = createNormalization();
  const { requireApproval, requirePermission, requireChannelPermission, requireManageableRole, requireManageableMember } = createSafety({ client, dryRun, yes });
  const resolveMessage = async (channelId, messageId) => {
    const channel = client.channels.cache.get(String(channelId));
    if (!channel?.messages?.fetch) throw Object.assign(new Error(`Message channel not found: ${channelId}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
    try { return await channel.messages.fetch(String(messageId)); }
    catch { throw Object.assign(new Error(`Message not found: ${messageId}`), { code: 'MESSAGE_NOT_FOUND', exitCode: 1 }); }
  };
  const settingsReason = operationOptions => operationOptions?.reason === undefined ? undefined : String(operationOptions.reason);
  return {
    bot: createBotApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
    voice: createVoiceApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
    messages: createMessagesApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
    channels: createChannelsApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
    guilds: createGuildsApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }),
  };

}
