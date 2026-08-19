import { createDiscordApi } from '../../discord.mjs';
import { normalizeCommand, suggestCommands } from './catalog.mjs';
import { createDiscordRuntime } from '../../runtime.mjs';
import { createCatalogHandler } from './catalog.mjs';
import { createPreviewHandler } from './preview.mjs';
import { createBotHandler } from './bot.mjs';
import { createGuildsHandler } from './guilds.mjs';
import { createMembersHandler } from './members.mjs';
import { createRolesHandler } from './roles.mjs';
import { createChannelsHandler } from './channels.mjs';
import { createMessagesHandler } from './messages.mjs';
import { createModerationHandler } from './moderation.mjs';
import { createEmojisHandler } from './emojis.mjs';
import { createStickersHandler } from './stickers.mjs';
import { createEventsHandler } from './events.mjs';
import { createInvitesHandler } from './invites.mjs';
import { createThreadsHandler } from './threads.mjs';
import { createWebhooksHandler } from './webhooks.mjs';
import { createPermissionsHandler } from './permissions.mjs';
import { createVoiceHandler } from './voice.mjs';
import { createVoiceUsersHandler } from './voice-users.mjs';
const handlers = [createBotHandler, createGuildsHandler, createMembersHandler, createRolesHandler, createChannelsHandler, createMessagesHandler, createModerationHandler, createEmojisHandler, createStickersHandler, createEventsHandler, createInvitesHandler, createThreadsHandler, createWebhooksHandler, createPermissionsHandler, createVoiceHandler, createVoiceUsersHandler];
export async function executeDirectCommand(input, options = {}) {
  const command = normalizeCommand(input);
  const catalog = createCatalogHandler(command, options); if (catalog.handled) return catalog.value;
  const preview = createPreviewHandler(command, options); if (preview.handled) return preview.value;
  const runtime = await createDiscordRuntime();
  try {
    const api = createDiscordApi(runtime.client, { ...options, dryRun: options.dry_run === true });
    const context = { command, options, api };
    for (const handler of handlers) { const result = handler(context); if (result.handled) return await result.value; }
    const unknown = command.join(' '); const suggestions = suggestCommands(unknown);
    throw Object.assign(new Error(`Unknown command: ${unknown}${suggestions.length ? `. Did you mean: ${suggestions.join(', ')}?` : ''}`), { code: 'UNKNOWN_COMMAND', exitCode: 2, details: suggestions.length ? { suggestions } : undefined });
  } finally { await runtime.shutdown(); }
}
