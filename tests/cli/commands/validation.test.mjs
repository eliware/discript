import { describe, expect, test } from '@jest/globals';
import { handled, option, required, unhandled } from '../../../src/cli/commands/validation.mjs';

describe('command validation helpers', () => { test('reports missing options', () => expect(() => required({}, 'guild', 'guild required', 'GUILD_REQUIRED')).toThrow(expect.objectContaining({ code: 'GUILD_REQUIRED', exitCode: 2 }))); });

test('provides shared option and handler result helpers', () => {
  expect(option({ guild: '1' }, 'guild', 'required')).toBe('1');
  expect(handled(3)).toEqual({ handled: true, value: 3 });
  expect(unhandled()).toEqual({ handled: false });
});
