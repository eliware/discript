import { describe, expect, test } from '@jest/globals';
import { parseArgs } from '../src/args.mjs';

describe('parseArgs', () => {
  test('separates positionals and valued options', () => {
    expect(parseArgs(['channels', 'list', '--guild', '123', '--json'])).toEqual({
      positionals: ['channels', 'list'],
      options: { guild: '123', json: true },
    });
  });

  test('supports short options and inline values', () => {
    expect(parseArgs(['-e', 'discord.guilds.list()', '--timeout=1000', '-y'])).toEqual({
      positionals: [],
      options: { eval: 'discord.guilds.list()', timeout: '1000', yes: true },
    });
  });

  test('supports connected dry-run validation', () => {
    expect(parseArgs(['channels', 'create', '--dry-run', '--validate'])).toEqual({
      positionals: ['channels', 'create'],
      options: { dry_run: true, validate: true },
    });
  });
});
