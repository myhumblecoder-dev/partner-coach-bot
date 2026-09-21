/** The chat ids permitted to talk to the bot, from a comma-separated env
 * value. Empty when unset — the caller decides what that means. */
export function parseAllowedChatIds(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '')
}
