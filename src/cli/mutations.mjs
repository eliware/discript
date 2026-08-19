export function previewMutation(command, options) {
  const action = `${command[0]}.${command[1] ?? 'run'}`;
  const requireOption = (name, code = `${name.toUpperCase()}_REQUIRED`) => {
    if (options[name] === undefined || options[name] === '') throw Object.assign(new Error(`${action} requires --${name.replaceAll('_', '-')} <value>.`), { code, exitCode: 2 });
  };
  const requireGuild = () => requireOption('guild', 'GUILD_REQUIRED');
  const requireChannel = () => requireOption('channel', 'CHANNEL_REQUIRED');
  const requireRole = () => requireOption('role', 'ROLE_REQUIRED');
  const requireUser = () => requireOption('user', 'USER_REQUIRED');
  const requireMessage = () => requireOption('message', 'MESSAGE_REQUIRED');
  const requireEvent = () => requireOption('event', 'EVENT_REQUIRED');
  const requireMutationTarget = () => {
    if (command[0] === 'roles' && ['create', 'update', 'delete', 'add', 'remove'].includes(command[1])) requireGuild();
    if (command[0] === 'moderation') requireGuild();
    if (command[0] === 'channels' && ['create'].includes(command[1])) requireGuild();
    if (command[0] === 'invites' && command[1] === 'create') requireGuild();
    if (command[0] === 'events' && ['create', 'update', 'delete'].includes(command[1])) requireGuild();
    if (command[0] === 'emojis' && ['create', 'update', 'delete'].includes(command[1])) requireGuild();
    if (command[0] === 'stickers' && ['create', 'update', 'delete'].includes(command[1])) requireGuild();
    if (command[0] === 'webhooks' && ['create', 'delete'].includes(command[1])) requireChannel();
    if (command[0] === 'permissions' && ['set', 'delete'].includes(command[1])) requireChannel();
  };
  requireMutationTarget();
  if (command[0] === 'roles' && ['add', 'remove'].includes(command[1])) { requireUser(); requireRole(); }
  if (command[0] === 'roles' && ['create', 'update'].includes(command[1])) requireOption('name', 'NAME_REQUIRED');
  if (command[0] === 'roles' && command[1] === 'delete') requireRole();
  if (command[0] === 'moderation') { requireUser(); if (command[1] === 'timeout') requireOption('duration', 'DURATION_REQUIRED'); }
  if (command[0] === 'channels' && command[1] === 'create') requireOption('name', 'NAME_REQUIRED');
  if (command[0] === 'channels' && command[1] === 'delete') requireChannel();
  if (command[0] === 'threads') { requireChannel(); if (command[1] === 'create') requireOption('name', 'NAME_REQUIRED'); if (command[1] === 'archive') requireOption('thread', 'THREAD_REQUIRED'); }
  if (command[0] === 'messages') { requireChannel(); if (['get', 'edit', 'delete', 'react', 'pin', 'unpin'].includes(command[1])) requireMessage(); if (['send', 'edit'].includes(command[1])) requireOption('content', 'CONTENT_REQUIRED'); if (command[1] === 'react') requireOption('emoji', 'EMOJI_REQUIRED'); if (command[1] === 'bulk-delete') requireOption('messages', 'MESSAGES_REQUIRED'); }
  if (command[0] === 'invites' && command[1] === 'create') requireChannel();
  if (command[0] === 'invites' && command[1] === 'delete') requireOption('invite', 'INVITE_REQUIRED');
  if (command[0] === 'events' && command[1] === 'create') { requireOption('name', 'NAME_REQUIRED'); requireOption('start', 'START_REQUIRED'); }
  if (command[0] === 'events' && command[1] === 'update') { requireEvent(); if (!options.name && !options.description && !options.start) throw Object.assign(new Error(`${action} requires --name, --description, or --start.`), { code: 'EVENT_FIELDS_REQUIRED', exitCode: 2 }); }
  if (command[0] === 'events' && command[1] === 'delete') requireEvent();
  if (command[0] === 'emojis' && ['get', 'update', 'delete'].includes(command[1])) requireOption('emoji', 'EMOJI_REQUIRED');
  if (command[0] === 'emojis' && ['create', 'update'].includes(command[1])) requireOption('name', 'NAME_REQUIRED');
  if (command[0] === 'emojis' && command[1] === 'create') requireOption('file', 'FILE_REQUIRED');
  if (command[0] === 'stickers' && ['get', 'update', 'delete'].includes(command[1])) requireOption('sticker', 'STICKER_REQUIRED');
  if (command[0] === 'stickers' && command[1] === 'create') { requireOption('name', 'NAME_REQUIRED'); requireOption('file', 'FILE_REQUIRED'); requireOption('tags', 'TAGS_REQUIRED'); }
  if (command[0] === 'stickers' && command[1] === 'update' && !options.name && !options.description && !options.tags) throw Object.assign(new Error(`${action} requires --name, --description, or --tags.`), { code: 'STICKER_FIELDS_REQUIRED', exitCode: 2 });
  if (command[0] === 'webhooks') { requireChannel(); if (command[1] === 'create') requireOption('name', 'NAME_REQUIRED'); if (command[1] === 'delete') requireOption('webhook', 'WEBHOOK_REQUIRED'); }
  if (command[0] === 'permissions') { requireChannel(); if (command[1] !== 'list') requireOption('target', 'TARGET_REQUIRED'); if (command[1] === 'set' && options.allow === undefined && options.deny === undefined) throw Object.assign(new Error(`${action} requires --allow and/or --deny.`), { code: 'PERMISSIONS_REQUIRED', exitCode: 2 }); }
  if (command[0] === 'voice-users') { requireGuild(); requireUser(); if (command[1] === 'move') requireChannel(); }
  if (command[0] === 'voice' && command[1] === 'join') requireChannel();
  if (command[0] === 'voice' && command[1] === 'leave') requireGuild();
  return { dryRun: true, action, command, parameters: Object.fromEntries(Object.entries(options).filter(([key]) => !['json', 'pretty', 'dry_run', 'yes'].includes(key))) };
}
