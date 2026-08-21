import { describe, expect, test } from '@jest/globals';
import { createConcurrencyLimiter } from '../src/mcp/limits.mjs';

describe('MCP concurrency limits', () => {
  test('bounds active work and releases queued work', async () => {
    const limiter = createConcurrencyLimiter(1);
    const firstRelease = await limiter.acquire();
    let secondStarted = false;
    const second = limiter.acquire().then(release => { secondStarted = true; return release; });
    await Promise.resolve();
    expect(limiter.active).toBe(1);
    expect(secondStarted).toBe(false);
    firstRelease();
    const secondRelease = await second;
    expect(secondStarted).toBe(true);
    secondRelease();
    expect(limiter.active).toBe(0);
  });
});
