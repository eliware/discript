import { describe, expect, test } from '@jest/globals';
import { createVoiceHandler } from '../../../src/cli/commands/voice.mjs';

describe('voice command handler', () => { test('ignores other commands', () => expect(createVoiceHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
