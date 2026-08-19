import { describe, expect, test } from '@jest/globals';
import { createBotHandler } from '../../../src/cli/commands/bot.mjs';

describe('bot command handler', () => { test('ignores other commands', () => expect(createBotHandler({ command: ['guilds', 'list'], api: {} })).toEqual({ handled: false })); });
