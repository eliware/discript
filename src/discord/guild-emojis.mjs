export function createGuildEmojisApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }) {
  return {
            list: () => mapCache(guild.emojis?.cache, emoji => ({ id: emoji.id, name: emoji.name, animated: emoji.animated ?? false })),
            get: id => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              return { id: emoji.id, name: emoji.name, animated: emoji.animated ?? false };
            },
            create: async (settings = {}, operationOptions = {}) => {
              if (!settings.name || !settings.attachment) throw Object.assign(new Error('Emoji creation requires name and attachment.'), { code: 'EMOJI_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Creating an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const emoji = await guild.emojis.create({ attachment: settings.attachment, name: String(settings.name), reason: settings.reason });
              return { id: emoji.id, name: emoji.name, animated: emoji.animated ?? false, created: true };
            },
            update: async (id, settings = {}, operationOptions = {}) => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              if (!settings.name) throw Object.assign(new Error('Emoji update requires name.'), { code: 'NAME_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Updating an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: emoji.id, settings };
              const updated = await emoji.edit({ name: String(settings.name), reason: settings.reason });
              return { id: updated.id, name: updated.name, animated: updated.animated ?? false, updated: true };
            },
            delete: async (id, operationOptions = {}) => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Deleting an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: emoji.id, deleted: true };
              await emoji.delete(settingsReason(operationOptions));
              return { id: emoji.id, deleted: true };
            },
          };
}
