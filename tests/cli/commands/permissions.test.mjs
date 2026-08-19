import { describe, expect, test } from '@jest/globals';
import { createPermissionsHandler } from '../../../src/cli/commands/permissions.mjs';

describe('permission command handler', () => { test('ignores other commands', () => expect(createPermissionsHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
