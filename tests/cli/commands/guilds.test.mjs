import { describe, expect, test } from '@jest/globals';
import { createGuildsHandler } from '../../../src/cli/commands/guilds.mjs';

describe('guild command handler', () => { test('ignores other commands', () => expect(createGuildsHandler({ command: ['bot', 'get'], options: {}, api: {} })).toEqual({ handled: false })); });
