import { describe, expect, test } from '@jest/globals';
import { createStickersHandler } from '../../../src/cli/commands/stickers.mjs';

describe('sticker command handler', () => { test('ignores other commands', () => expect(createStickersHandler({ command: ['guilds', 'list'], options: {}, api: {} })).toEqual({ handled: false })); });
