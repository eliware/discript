import { previewMutation } from '../mutations.mjs';
export { previewMutation };
export function createPreviewHandler(command, options) {
  if (!options.dry_run) return { handled: false };
  const value = previewMutation(command, options);
  return options.validate ? { handled: false } : { handled: true, value };
}
