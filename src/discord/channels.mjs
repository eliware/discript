export function createChannelsApi({ client, dryRun, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, requireApproval, requireChannelPermission }) {
  return {
      get: id => {
        const channel = client.channels.cache.get(String(id));
        if (!channel) throw Object.assign(new Error(`Channel not found: ${id}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
        return {
          ...normalizeChannel(channel),
          update: async (settings = {}, operationOptions = {}) => {
            if (!settings.name && settings.topic === undefined) throw Object.assign(new Error('Channel update requires name or topic.'), { code: 'CHANNEL_FIELDS_REQUIRED', exitCode: 2 });
            requireChannelPermission(channel.id, 'ManageChannels');
            requireApproval('Updating a channel', operationOptions);
            const changes = { ...(settings.name ? { name: String(settings.name) } : {}), ...(settings.topic !== undefined ? { topic: settings.topic === null ? null : String(settings.topic) } : {}) };
            if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, ...changes, updated: true };
            if (!channel.edit) throw Object.assign(new Error('Channel editing is unavailable.'), { code: 'CHANNELS_UNSUPPORTED', exitCode: 1 });
            return { ...normalizeChannel(await channel.edit(changes, operationOptions.reason)), ...changes, updated: true };
          },
          webhooks: {
            list: async () => {
              if (!channel.fetchWebhooks) throw Object.assign(new Error('Webhook listing is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              return mapCache(await channel.fetchWebhooks(), normalizeWebhook);
            },
            create: async (name, operationOptions = {}) => {
              if (!name) throw Object.assign(new Error('Webhook creation requires name.'), { code: 'NAME_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageWebhooks');
              requireApproval('Creating a webhook', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name: String(name), created: true };
              if (!channel.createWebhook) throw Object.assign(new Error('Webhook creation is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              return { ...normalizeWebhook(await channel.createWebhook({ name: String(name), reason: operationOptions.reason })), created: true };
            },
            delete: async (webhookId, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'ManageWebhooks');
              requireApproval('Deleting a webhook', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, webhookId: String(webhookId), deleted: true };
              if (!client.fetchWebhook) throw Object.assign(new Error('Webhook deletion is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              const webhook = await client.fetchWebhook(String(webhookId));
              await webhook.delete(operationOptions.reason);
              return { id: String(webhookId), deleted: true };
            },
          },
          permissions: {
            list: () => mapCache(channel.permissionOverwrites?.cache, normalizeOverwrite),
            set: async (targetId, settings = {}, operationOptions = {}) => {
              if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
              if (!Array.isArray(settings.allow) && !Array.isArray(settings.deny)) throw Object.assign(new Error('Permission overwrite requires allow or deny arrays.'), { code: 'PERMISSIONS_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageChannels');
              requireApproval('Setting channel permissions', operationOptions);
              const changes = { ...(Array.isArray(settings.allow) ? { allow: settings.allow } : {}), ...(Array.isArray(settings.deny) ? { deny: settings.deny } : {}) };
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), ...changes, updated: true };
              if (!channel.permissionOverwrites?.edit) throw Object.assign(new Error('Channel permission editing is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
              const overwrite = await channel.permissionOverwrites.edit(String(targetId), changes, { reason: operationOptions.reason });
              return { channelId: channel.id, ...normalizeOverwrite(overwrite), updated: true };
            },
            delete: async (targetId, operationOptions = {}) => {
              if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageChannels');
              requireApproval('Deleting channel permissions', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), deleted: true };
              if (!channel.permissionOverwrites?.delete) throw Object.assign(new Error('Channel permission deletion is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
              await channel.permissionOverwrites.delete(String(targetId), operationOptions.reason);
              return { channelId: channel.id, targetId: String(targetId), deleted: true };
            },
          },
          threads: {
            list: () => mapCache(channel.threads?.cache, thread => ({ id: thread.id, name: thread.name, archived: thread.archived ?? false })),
            create: async (name, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'CreatePublicThreads');
              requireApproval('Creating a thread', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name, created: true };
              const thread = await channel.threads.create({ name: String(name) });
              return { id: thread.id, name: thread.name, created: true };
            },
            archive: async (threadId, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'ManageThreads');
              requireApproval('Archiving a thread', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, threadId: String(threadId), archived: true };
              const thread = channel.threads?.cache?.get(String(threadId));
              if (!thread) throw Object.assign(new Error(`Thread not found: ${threadId}`), { code: 'THREAD_NOT_FOUND', exitCode: 1 });
              await thread.setArchived(true);
              return { id: thread.id, archived: true };
            },
          },
          delete: async (operationOptions = {}) => {
            requireChannelPermission(channel.id, 'ManageChannels');
            requireApproval('Deleting a channel', operationOptions);
            if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, deleted: true };
            await channel.delete();
            return { id: channel.id, deleted: true };
          },
          send: async (content, operationOptions = {}) => {
            requireChannelPermission(channel.id, 'SendMessages');
            requireApproval('Sending a message', operationOptions);
            if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, content };
            return normalizeMessage(await channel.send(String(content)));
          },
        };
      },
    };
}
