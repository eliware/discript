import { describe, expect, test } from '@jest/globals';
import { createThreadsHandler } from '../../../src/cli/commands/threads.mjs';

describe('thread command handler', () => { test('ignores other commands', () => expect(createThreadsHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
