import { describe, expect, test } from '@jest/globals';
import { createPreviewHandler } from '../../../src/cli/commands/preview.mjs';

describe('mutation preview handler', () => { test('does nothing when dry-run is disabled', () => expect(createPreviewHandler(['messages', 'send'], {})).toEqual({ handled: false })); });
