export function createConcurrencyLimiter(limit = 4, maxPending = capacityDefault(limit)) {
  const capacity = Math.max(1, Number.isInteger(limit) ? limit : 4);
  const pendingLimit = Math.max(0, Number.isInteger(maxPending) ? maxPending : capacity * 8);
  let active = 0;
  const queue = [];
  const acquire = () => {
    if (active >= capacity && queue.length >= pendingLimit) {
      return Promise.reject(Object.assign(new Error('MCP execution queue is full.'), { code: 'MCP_QUEUE_FULL', exitCode: 75 }));
    }
    return new Promise(resolve => { queue.push(resolve); drain(); });
  };
  function drain() {
    while (active < capacity && queue.length) {
      active += 1;
      queue.shift()(() => { active -= 1; drain(); });
    }
  }
  return { acquire, get active() { return active; }, get pending() { return queue.length; }, limit: capacity, maxPending: pendingLimit };
}

function capacityDefault(limit) {
  return Number.isInteger(limit) && limit > 0 ? limit * 8 : 32;
}
