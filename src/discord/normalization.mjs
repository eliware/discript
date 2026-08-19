export function createNormalization() {
  const mapCache = (cache, mapper) => typeof cache?.map === 'function' ? cache.map(mapper) : [...(cache?.values?.() ?? [])].map(mapper);
  const normalizeChannel = channel => ({ id: channel.id, name: channel.name, type: channel.type, ...(channel.parentId !== undefined ? { parentId: channel.parentId ?? null } : {}), ...(channel.position !== undefined ? { position: channel.position ?? null } : {}) });
  const normalizeMessage = message => ({ id: message.id, channelId: message.channelId, content: message.content ?? null });
  const normalizeWebhook = webhook => ({ id: webhook.id, name: webhook.name ?? null, channelId: webhook.channelId ?? null, type: webhook.type ?? null });
  const normalizeOverwrite = overwrite => ({ id: overwrite.id, type: overwrite.type ?? null, allow: overwrite.allow?.toArray?.() ?? [], deny: overwrite.deny?.toArray?.() ?? [] });
  return { mapCache, normalizeChannel, normalizeMessage, normalizeWebhook, normalizeOverwrite };
}
