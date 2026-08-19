import { describe, expect, test } from '@jest/globals';
import { createRolesHandler } from '../../../src/cli/commands/roles.mjs';

describe('role command handler', () => { test('ignores other commands', () => expect(createRolesHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
