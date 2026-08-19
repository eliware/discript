export function createBotApi({ client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission, settingsReason }) {
  return {
      get: () => {
        if (!client.user) throw Object.assign(new Error('Bot identity is unavailable.'), { code: 'BOT_IDENTITY_UNAVAILABLE', exitCode: 1 });
        return { id: client.user.id, username: client.user.username, tag: client.user.tag ?? null };
      },
    };
}
