import { describe, expect, test } from '@jest/globals';
import { createMessagesHandler } from '../../../src/cli/commands/messages.mjs';

describe('message command handler', () => { test('ignores other commands', () => expect(createMessagesHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
