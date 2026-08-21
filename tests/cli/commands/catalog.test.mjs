import { describe, expect, test } from '@jest/globals';
import { createCatalogHandler, normalizeCommand, suggestCommands } from '../../../src/cli/commands/catalog.mjs';

describe('command catalog handler', () => { test('returns the catalog', () => expect(createCatalogHandler(['commands', 'list']).handled).toBe(true)); });

test('normalizes command aliases and suggests nearby commands', () => {
  expect(normalizeCommand(['guild', 'ls'])).toEqual(['guilds', 'ls']);
  expect(suggestCommands('guilds lst')).toContain('guilds list');
  expect(createCatalogHandler(['completion', 'zsh'])).toMatchObject({ handled: true, value: expect.stringContaining('compdef') });
  expect(createCatalogHandler(['unknown'])).toEqual({ handled: false });
});
