export function createGuildScheduledEventsApi({ guild, client, dryRun, loadVoiceModule, mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite, resolveMessage, settingsReason, requireApproval, requirePermission, requireManageableRole, requireManageableMember, requireChannelPermission }) {
  return {
            list: () => mapCache(guild.scheduledEvents?.cache, event => ({ id: event.id, name: event.name, status: event.status ?? null, scheduledStartAt: event.scheduledStartAt?.toISOString?.() ?? event.scheduledStartAt ?? null, scheduledEndAt: event.scheduledEndAt?.toISOString?.() ?? event.scheduledEndAt ?? null })),
            create: async (settings = {}, operationOptions = {}) => {
              if (!guild.scheduledEvents?.create) throw Object.assign(new Error('Scheduled event creation is unavailable.'), { code: 'SCHEDULED_EVENTS_UNSUPPORTED', exitCode: 1 });
              requirePermission(guild, 'ManageEvents');
              requireApproval('Creating a scheduled event', operationOptions);
              if (!settings.name || !settings.scheduledStartTime) throw Object.assign(new Error('Scheduled event requires name and scheduledStartTime.'), { code: 'EVENT_FIELDS_REQUIRED', exitCode: 2 });
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const event = await guild.scheduledEvents.create(settings);
              return { id: event.id, name: event.name, created: true };
            },
            get: id => {
              const event = guild.scheduledEvents?.cache?.get(String(id));
              if (!event) throw Object.assign(new Error(`Scheduled event not found: ${id}`), { code: 'SCHEDULED_EVENT_NOT_FOUND', exitCode: 1 });
              return {
                id: event.id,
                name: event.name,
                status: event.status ?? null,
                update: async (settings = {}, operationOptions = {}) => {
                  requirePermission(guild, 'ManageEvents');
                  requireApproval('Updating a scheduled event', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: event.id, settings };
                  const updated = await event.edit(settings);
                  return { id: updated.id, name: updated.name, updated: true };
                },
                delete: async (operationOptions = {}) => {
                  requirePermission(guild, 'ManageEvents');
                  requireApproval('Deleting a scheduled event', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: event.id, deleted: true };
                  await event.delete();
                  return { id: event.id, deleted: true };
                },
              };
            },
          };
}
