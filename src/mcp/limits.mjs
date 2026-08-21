export function createConcurrencyLimiter(limit = 4) {
  const capacity = Math.max(1, Number.isInteger(limit) ? limit : 4);
  let active = 0;
  const queue = [];
  const acquire = () => new Promise(resolve => {
    queue.push(resolve);
    drain();
  });
  function drain() {
    while (active < capacity && queue.length) {
      active += 1;
      queue.shift()(() => { active -= 1; drain(); });
    }
  }
  return { acquire, get active() { return active; }, get pending() { return queue.length; }, limit: capacity };
}
