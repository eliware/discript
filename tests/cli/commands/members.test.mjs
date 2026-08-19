import { describe, expect, test } from '@jest/globals';
import { createMembersHandler } from '../../../src/cli/commands/members.mjs';

describe('member command handler', () => { test('ignores other commands', () => expect(createMembersHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
