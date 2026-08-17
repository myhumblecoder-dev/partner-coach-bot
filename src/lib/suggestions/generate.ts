import { prisma } from '@/lib/db';
import { generate } from '@/lib/ai';
import { getProfileContext } from '@/lib/profile/context';
import { buildSuggestionPrompt, type SuggestionKind, type Audience } from '@/lib/suggestions/prompt';

export async function generateSuggestion(profileId: string, kind: SuggestionKind, audience: Audience): Promise<string | null> {
  const context = await getProfileContext(profileId);
  if (!context) {
    return null;
  }

  const existingSuggestions = await prisma.suggestion.findMany({
    where: { profileId },
  });
  const existingBodies = existingSuggestions.map((s) => s.body);

  const prompt = buildSuggestionPrompt(context, existingBodies, kind, audience);
  const body = await generate(prompt);

  await prisma.suggestion.create({
    data: {
      profileId,
      body,
      kind,
      audience,
    },
  });

  return body;
}