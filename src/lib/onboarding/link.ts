import { prisma } from '@/lib/db';
import { parseAllowedChatIds } from '@/lib/telegram/allowlist';

/** The profile this chat may talk to, or null when it may not.
 *
 * The webhook secret authenticates TELEGRAM, not the person typing:
 * Telegram delivers anyone's message to the webhook. This used to bind any
 * new chatId to `profile.findFirst()` — the owner's profile — so a stranger
 * who found the bot got a coach whose prompt carries the entire study, and
 * had their own messages extracted into the owner's portrait.
 */
export async function ensureLinkedProfile(chatId: string): Promise<{ profileId: string; created: boolean } | null> {
  const existingChat = await prisma.telegramChat.findUnique({
    where: { chatId },
  });

  if (existingChat) {
    return { profileId: existingChat.profileId, created: false };
  }

  // An unlinked chat has to earn the link.
  const allowed = parseAllowedChatIds(process.env.TELEGRAM_ALLOWED_CHAT_IDS);
  if (allowed.length > 0) {
    if (!allowed.includes(chatId)) return null;
  } else {
    // No allowlist set: the first chat ever seen claims the bot and every
    // later stranger is refused. First-run onboarding keeps working without
    // leaving the door open behind it.
    const linkedAlready = await prisma.telegramChat.count();
    if (linkedAlready > 0) return null;
  }

  let profile = await prisma.profile.findFirst();

  if (!profile) {
    profile = await prisma.profile.create({
      data: { name: 'Your person' },
    });
  }

  await prisma.telegramChat.create({
    data: {
      chatId,
      profileId: profile.id,
    },
  });

  return { profileId: profile.id, created: true };
}