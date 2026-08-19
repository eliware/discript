export function createRestDiscordApi(rest) {
  const guild = guildId => ({
    id: String(guildId),
    async info() { return rest.request(`/guilds/${guildId}`); },
    async channels() { return rest.request(`/guilds/${guildId}/channels`); },
  });
  return {
    channels: {
      async get(channelId) { return rest.request(`/channels/${channelId}`); },
    },
    guilds: {
      async list() { return rest.request('/users/@me/guilds'); },
      get: guild,
    },
  };
}

export async function executeRestRead(command, options, rest) {
  const guild = options.guild;
  const channel = options.channel;
  const routes = {
    'members list': `/guilds/${guild}/members`,
    'roles list': `/guilds/${guild}/roles`,
    'emojis list': `/guilds/${guild}/emojis`,
    'stickers list': `/guilds/${guild}/stickers`,
    'events list': `/guilds/${guild}/scheduled-events`,
    'invites list': `/guilds/${guild}/invites`,
    'webhooks list': `/channels/${channel}/webhooks`,
    'messages list': `/channels/${channel}/messages`,
  };
  const route = routes[command.join(' ')];
  if (route) return rest.request(route, { query: options.limit ? { limit: String(options.limit) } : undefined });
  if (command.join(' ') === 'messages get') return rest.request(`/channels/${channel}/messages/${options.message}`);
  return undefined;
}

export async function executeRestOperation(command, options, rest) {
  const key = command.join(' ');
  const operation = restMutation(key, options);
  if (!operation) return undefined;
  if (options.dry_run === true) return { dryRun: true, method: operation.method, route: operation.route, ...(operation.body ? { body: operation.body } : {}) };
  if (operation.destructive && options.yes !== true) throw Object.assign(new Error(`${key} requires --yes or -y.`), { code: 'APPROVAL_REQUIRED', exitCode: 2 });
  return rest.request(operation.route, { method: operation.method, ...(operation.body ? { body: operation.body } : {}) });
}

function restMutation(key, options) {
  const guild = options.guild;
  const channel = options.channel;
  if (key === 'channels create') return { method: 'POST', route: `/guilds/${guild}/channels`, body: { name: options.name, type: channelType(options.type), ...(options.parent ? { parent_id: options.parent } : {}), ...(options.position !== undefined ? { position: Number(options.position) } : {}) } };
  if (key === 'channels update') return { method: 'PATCH', route: `/channels/${channel}`, body: { ...(options.name ? { name: options.name } : {}), ...(options.topic !== undefined ? { topic: options.topic } : {}), ...(options.parent !== undefined ? { parent_id: options.parent || null } : {}), ...(options.position !== undefined ? { position: Number(options.position) } : {}) } };
  if (key === 'channels delete') return { method: 'DELETE', route: `/channels/${channel}`, destructive: true };
  if (key === 'messages send') return { method: 'POST', route: `/channels/${channel}/messages`, body: { content: options.content } };
  if (key === 'messages edit') return { method: 'PATCH', route: `/channels/${channel}/messages/${options.message}`, body: { content: options.content } };
  if (key === 'messages delete') return { method: 'DELETE', route: `/channels/${channel}/messages/${options.message}`, destructive: true };
  if (key === 'roles create') return { method: 'POST', route: `/guilds/${guild}/roles`, body: { name: options.name } };
  if (key === 'roles delete') return { method: 'DELETE', route: `/guilds/${guild}/roles/${options.role}`, destructive: true };
  if (key === 'moderation kick') return { method: 'DELETE', route: `/guilds/${guild}/members/${options.user}`, destructive: true };
  if (key === 'moderation ban') return { method: 'PUT', route: `/guilds/${guild}/bans/${options.user}`, destructive: true, body: {} };
  if (key === 'events delete') return { method: 'DELETE', route: `/guilds/${guild}/scheduled-events/${options.event}`, destructive: true };
  if (key === 'invites delete') return { method: 'DELETE', route: `/invites/${options.invite}`, destructive: true };
  if (key === 'webhooks delete') return { method: 'DELETE', route: `/webhooks/${options.webhook}`, destructive: true };
  if (key === 'permissions set') return { method: 'PUT', route: `/channels/${channel}/permissions/${options.target}`, body: { allow: options.allow ?? '', deny: options.deny ?? '', type: Number(options.permission_type ?? 0) } };
  if (key === 'permissions delete') return { method: 'DELETE', route: `/channels/${channel}/permissions/${options.target}`, destructive: true };
  return undefined;
}

function channelType(type) {
  if (type === 'voice') return 2;
  if (type === 'category') return 4;
  return type === undefined || type === 'text' ? 0 : Number(type);
}
