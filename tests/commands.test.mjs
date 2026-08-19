import { commandCatalog, completionScript, normalizeCommand, suggestCommands } from '../src/commands.mjs';

describe('command discovery', () => {
  test('normalizes common singular and abbreviated aliases', () => {
    expect(normalizeCommand(['msg', 'send'])).toEqual(['messages', 'send']);
    expect(normalizeCommand(['guild', 'list'])).toEqual(['guilds', 'list']);
  });

  test('exposes catalog and shell completion formats', () => {
    expect(commandCatalog()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'messages send' })]));
    expect(completionScript('bash')).toContain('complete -F');
    expect(completionScript('zsh')).toContain('#compdef discript');
    expect(completionScript('fish')).toContain('complete -c discript');
  });

  test('rejects unsupported shells', () => {
    expect(() => completionScript('powershell')).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_SHELL' }));
  });

  test('suggests nearby commands', () => {
    expect(suggestCommands('messags send')).toContain('messages send');
  });
});
