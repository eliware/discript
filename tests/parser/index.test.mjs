import { describe, expect, test } from '@jest/globals';
import { readFile } from 'node:fs/promises';


import { parse } from '../../src/parser.mjs';



describe('agent examples', () => {
  test('all packaged examples parse successfully', async () => {
    for (const file of ['list-guilds.ds', 'safe-channel-workflow.ds', 'event-monitor.ds']) {
      const source = await readFile(new URL(`../../examples/${file}`, import.meta.url), 'utf8');
      expect(() => parse(source)).not.toThrow();
    }
  });
});
