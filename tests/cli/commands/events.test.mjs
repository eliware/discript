import { describe, expect, test } from '@jest/globals';
import { createEventsHandler } from '../../../src/cli/commands/events.mjs';

describe('scheduled event command handler', () => { test('ignores other commands', () => expect(createEventsHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
