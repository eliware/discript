export function createGuildStickersApi({ guild, dryRun, mapCache, settingsReason, requireApproval, requirePermission }) {
  return {
            list: () => mapCache(guild.stickers?.cache, sticker => ({ id: sticker.id, name: sticker.name, description: sticker.description ?? null })),
            get: id => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              return { id: sticker.id, name: sticker.name, description: sticker.description ?? null };
            },
            create: async (settings = {}, operationOptions = {}) => {
              if (!settings.name || !settings.file || !settings.tags) throw Object.assign(new Error('Sticker creation requires name, file, and tags.'), { code: 'STICKER_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Creating a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const sticker = await guild.stickers.create({ file: settings.file, name: String(settings.name), description: settings.description, tags: String(settings.tags), reason: settings.reason });
              return { id: sticker.id, name: sticker.name, description: sticker.description ?? null, created: true };
            },
            update: async (id, settings = {}, operationOptions = {}) => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              if (!settings.name && !settings.description && !settings.tags) throw Object.assign(new Error('Sticker update requires name, description, or tags.'), { code: 'STICKER_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Updating a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: sticker.id, settings };
              const updated = await sticker.edit({ name: settings.name, description: settings.description, tags: settings.tags, reason: settings.reason });
              return { id: updated.id, name: updated.name, description: updated.description ?? null, updated: true };
            },
            delete: async (id, operationOptions = {}) => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Deleting a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: sticker.id, deleted: true };
              await sticker.delete(settingsReason(operationOptions));
              return { id: sticker.id, deleted: true };
            },
          };
}
