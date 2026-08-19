import { commandCatalog, completionScript, normalizeCommand, suggestCommands } from '../../commands.mjs';
export { commandCatalog, completionScript, normalizeCommand, suggestCommands };
export function createCatalogHandler(command) {
  if (command.join(' ') === 'commands list') return { handled: true, value: commandCatalog() };
  if (command[0] === 'completion') return { handled: true, value: completionScript(command[1] ?? 'bash') };
  return { handled: false };
}
