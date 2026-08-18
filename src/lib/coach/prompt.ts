import type { ProfileContext } from '@/lib/profile/context';

export function buildCoachPrompt(
  context: ProfileContext,
  history: { role: string; text: string }[],
  userMessage: string
): string {
  const sections: string[] = [];

  if (context.likes.length > 0) {
    sections.push(`Likes: ${context.likes.join(', ')}`);
  }
  if (context.dislikes.length > 0) {
    sections.push(`Dislikes: ${context.dislikes.join(', ')}`);
  }
  if (context.jokes.length > 0) {
    sections.push(`Jokes: ${context.jokes.join(', ')}`);
  }
  if (context.dreams.length > 0) {
    sections.push(`Dreams: ${context.dreams.join(', ')}`);
  }
  if (context.recentMoods.length > 0) {
    const moods = context.recentMoods
      .map((m) => `${m.label}${m.note ? ': ' + m.note : ''}`)
      .join(', ');
    sections.push(`Recent moods: ${moods}`);
  }
  if (context.recentEvents.length > 0) {
    const events = context.recentEvents
      .map((e) => `${e.title}${e.note ? ': ' + e.note : ''}`)
      .join(', ');
    sections.push(`Recent events: ${events}`);
  }
  if (context.pastGifts.length > 0) {
    sections.push(`Past gifts: ${context.pastGifts.join(', ')}`);
  }
  if (context.pastTrips.length > 0) {
    sections.push(`Past trips: ${context.pastTrips.join(', ')}`);
  }

  const contextString = sections.length > 0 ? sections.join('\n') : '';

  let prompt = `You are a relationship coach. Your job is to help the user understand and delight their partner, ${context.name}, using only the information provided in the profile records below.\n\n`;

  if (contextString) {
    prompt += `${contextString}\n\n`;
  }

  prompt += 'Do not invent facts about the partner that are absent from the context.\n\n';

  for (const entry of history) {
    prompt += `${entry.role}: ${entry.text}\n`;
  }

  prompt += `\nUser: ${userMessage}`;

  return prompt;
}