import { describe, expect, test } from '@jest/globals';
import { createChannelsHandler } from '../../../src/cli/commands/channels.mjs';

describe('channel command handler', () => { test('ignores other commands', () => expect(createChannelsHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
