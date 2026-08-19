import { describe, expect, test } from '@jest/globals';
import { createWebhooksHandler } from '../../../src/cli/commands/webhooks.mjs';

describe('webhook command handler', () => { test('ignores other commands', () => expect(createWebhooksHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
