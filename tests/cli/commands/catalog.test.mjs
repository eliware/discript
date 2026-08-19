import { describe, expect, test } from '@jest/globals';
import { createCatalogHandler } from '../../../src/cli/commands/catalog.mjs';

describe('command catalog handler', () => { test('returns the catalog', () => expect(createCatalogHandler(['commands', 'list']).handled).toBe(true)); });
