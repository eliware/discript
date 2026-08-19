export function createBotHandler({ command, api }) { return command[0] === 'bot' && command[1] === 'get' ? { handled: true, value: api.bot.get() } : { handled: false }; }
