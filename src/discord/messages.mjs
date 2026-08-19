export function createMessagesApi({ client, dryRun, normalizeMessage, resolveMessage, requireApproval, requireChannelPermission }) {
  return {
      list: async (channelId, options = {}) => {
        requireChannelPermission(channelId, 'ViewChannel');
        const channel = client.channels.cache.get(String(channelId));
        if (!channel?.messages?.fetch) throw Object.assign(new Error(`Message listing is unavailable: ${channelId}`), { code: 'MESSAGES_UNSUPPORTED', exitCode: 1 });
        const messages = await channel.messages.fetch({ limit: options.limit ? Number(options.limit) : 50 });
        return typeof messages.map === 'function' ? messages.map(normalizeMessage) : [...messages.values()].map(normalizeMessage);
      },
      get: async (channelId, messageId) => normalizeMessage(await resolveMessage(channelId, messageId)),
      edit: async (channelId, messageId, content, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Editing a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), content };
        return normalizeMessage(await (await resolveMessage(channelId, messageId)).edit(String(content)));
      },
      delete: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Deleting a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), deleted: true };
        await (await resolveMessage(channelId, messageId)).delete();
        return { id: String(messageId), deleted: true };
      },
      react: async (channelId, messageId, emoji, operationOptions = {}) => {
        requireChannelPermission(channelId, 'AddReactions');
        requireApproval('Reacting to a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), emoji };
        await (await resolveMessage(channelId, messageId)).react(String(emoji));
        return { id: String(messageId), reacted: true, emoji };
      },
      pin: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Pinning a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), pinned: true };
        await (await resolveMessage(channelId, messageId)).pin();
        return { id: String(messageId), pinned: true };
      },
      unpin: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Unpinning a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), pinned: false };
        await (await resolveMessage(channelId, messageId)).unpin();
        return { id: String(messageId), pinned: false };
      },
      bulkDelete: async (channelId, messageIds, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Bulk deleting messages', operationOptions);
        const ids = Array.isArray(messageIds) ? messageIds.map(String) : String(messageIds).split(',').map(value => value.trim()).filter(Boolean);
        if (!ids.length) throw Object.assign(new Error('At least one message ID is required.'), { code: 'MESSAGES_REQUIRED', exitCode: 2 });
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageIds: ids, deleted: ids.length };
        const channel = client.channels.cache.get(String(channelId));
        if (!channel?.bulkDelete) throw Object.assign(new Error(`Channel does not support bulk deletion: ${channelId}`), { code: 'BULK_DELETE_UNSUPPORTED', exitCode: 1 });
        const deleted = await channel.bulkDelete(ids);
        return { channelId: String(channelId), deleted: deleted.size ?? ids.length };
      },
    };
}
