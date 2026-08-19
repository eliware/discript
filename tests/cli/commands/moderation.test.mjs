import { describe, expect, test } from '@jest/globals';
import { createModerationHandler } from '../../../src/cli/commands/moderation.mjs';

describe('moderation command handler', () => { test('ignores other commands', () => expect(createModerationHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
