import { commandCatalog, completionScript, normalizeCommand, suggestCommands } from '../src/commands.mjs';

describe('command discovery', () => {
  test('normalizes common singular and abbreviated aliases', () => {
    expect(normalizeCommand(['msg', 'send'])).toEqual(['messages', 'send']);
    expect(normalizeCommand(['guild', 'list'])).toEqual(['guilds', 'list']);
    expect(normalizeCommand()).toEqual([]);
    expect(normalizeCommand(['unknown', 'list'])).toEqual(['unknown', 'list']);
  });

  test('exposes catalog and shell completion formats', () => {
    expect(commandCatalog()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'messages send' })]));
    expect(completionScript('bash')).toContain('complete -F');
    expect(completionScript('zsh')).toContain('#compdef discript');
    expect(completionScript('fish')).toContain('complete -c discript');
    expect(completionScript()).toContain('complete -F');
  });

  test('catalog exposes the major Discord capability families', () => {
    const names = commandCatalog().map(command => command.name);
    expect(names).toEqual(expect.arrayContaining([
      'guilds list', 'channels list', 'messages get', 'members get', 'roles list',
      'moderation ban', 'threads list', 'invites list', 'events list', 'voice status',
      'webhooks list', 'permissions list', 'emojis list', 'stickers list',
    ]));
  });

  test('rejects unsupported shells', () => {
    expect(() => completionScript('powershell')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_SHELL' }));
  });

  test('suggests nearby commands', () => {
    expect(suggestCommands('messags send')).toContain('messages send');
  });
});
