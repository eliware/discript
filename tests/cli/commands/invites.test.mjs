import { describe, expect, test } from '@jest/globals';
import { createInvitesHandler } from '../../../src/cli/commands/invites.mjs';

describe('invite command handler', () => { test('ignores other commands', () => expect(createInvitesHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
