import { describe, expect, jest, test } from '@jest/globals';
import { createBotHandler } from '../../../src/cli/commands/bot.mjs';

describe('bot command handler', () => {
  test('gets the bot', () => { const get = jest.fn().mockReturnValue('bot'); expect(createBotHandler({ command: ['bot', 'get'], api: { bot: { get } } })).toEqual({ handled: true, value: 'bot' }); expect(get).toHaveBeenCalled(); });
  test('ignores other commands', () => expect(createBotHandler({ command: ['guilds', 'list'], api: {} })).toEqual({ handled: false }));
});
