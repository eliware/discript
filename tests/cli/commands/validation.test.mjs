import { describe, expect, test } from '@jest/globals';
import { required } from '../../../src/cli/commands/validation.mjs';

describe('command validation helpers', () => { test('reports missing options', () => expect(() => required({}, 'guild', 'guild required', 'GUILD_REQUIRED')).toThrow(expect.objectContaining({ code: 'GUILD_REQUIRED', exitCode: 2 }))); });
