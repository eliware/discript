import { createDiscordRest } from './rest.mjs';

export async function getGatewaySessionLimits({ token, rest } = {}) {
  const requester = rest ?? createDiscordRest({ token });
  const response = await requester.request('/gateway/bot');
  const limits = response.session_start_limit ?? {};
  return { total: Number(limits.total ?? 0), remaining: Number(limits.remaining ?? 0), resetAfter: Number(limits.reset_after ?? 0), maxConcurrency: Number(limits.max_concurrency ?? 1), shards: Number(response.shards ?? 1) };
}

export function shouldWaitForGatewayStart(limits) { return limits.remaining <= 0; }
