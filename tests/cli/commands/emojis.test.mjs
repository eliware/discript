import { describe, expect, test } from '@jest/globals';
import { createEmojisHandler } from '../../../src/cli/commands/emojis.mjs';

describe('emoji command handler', () => { test('ignores other commands', () => expect(createEmojisHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
