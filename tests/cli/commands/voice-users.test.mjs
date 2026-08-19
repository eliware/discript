import { describe, expect, test } from '@jest/globals';
import { createVoiceUsersHandler } from '../../../src/cli/commands/voice-users.mjs';

describe('voice-user command handler', () => { test('ignores other commands', () => expect(createVoiceUsersHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
