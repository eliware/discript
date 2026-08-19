import { describe, expect, test } from '@jest/globals';
import { executeDirectCommand } from '../../../src/cli/commands/index.mjs';

describe('command dispatcher', () => { test('handles catalog commands without connecting', async () => expect(executeDirectCommand(['commands', 'list'], {})).resolves.toEqual(expect.any(Array))); });
