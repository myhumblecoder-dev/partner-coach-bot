import { prisma } from '@/lib/db';

export async function ensureLinkedProfile(chatId: string): Promise<{ profileId: string; created: boolean }> {
  const existingChat = await prisma.telegramChat.findUnique({
    where: { chatId },
  });

  if (existingChat) {
    return { profileId: existingChat.profileId, created: false };
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