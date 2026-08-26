import type { ProfileContext } from '@/lib/profile/context';
import { localDayParts } from '@/lib/cadence/localDay';

export function buildCoachPrompt(
  context: ProfileContext,
  history: { role: string; text: string }[],
  userMessage: string
): string {
  const sections: string[] = [];

  if (context.summary) {
    sections.push(`What you understand about ${context.name}: ${context.summary}`);
  }

  const facetMap: Record<string, string> = {
    likes: 'Likes:',
    dislikes: 'Dislikes:',
    jokes: 'Jokes:',
    dreams: 'Dreams:',
    trips: 'Past trips:',
  };

  const handleSection = (key: 'likes' | 'dislikes' | 'jokes' | 'dreams' | 'trips', rawList: string[]) => {
    const sectionFacets = context.facets?.filter((f) => f.section === key) || [];
    if (sectionFacets.length > 0) {
      const heading = facetMap[key];
      const findings = sectionFacets
        .map((f) => `${f.label} (×${f.evidenceCount})`)
        .join(', ');
      sections.push(`${heading} ${findings}`);
    } else if (rawList.length > 0) {
      sections.push(`${facetMap[key]} ${rawList.join(', ')}`);
    }
  };

  handleSection('likes', context.likes);
  handleSection('dislikes', context.dislikes);
  handleSection('jokes', context.jokes);
  handleSection('dreams', context.dreams);
  handleSection('trips', context.pastTrips);

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

  if (context.giftRecord && context.giftRecord.length > 0) {
    const gifts = context.giftRecord
      .map((g) => {
        const outcome = g.howItLanded === 'hit' ? 'landed' : g.howItLanded === 'miss' ? 'missed' : 'unrated';
        return `${g.description} ${outcome}`;
      })
      .join('\n');
    sections.push(`Gift record:\n${gifts}`);
  } else if (context.pastGifts.length > 0) {
    sections.push(`Past gifts: ${context.pastGifts.join(', ')}`);
  }

  const contextString = sections.length > 0 ? sections.join('\n') : '';

  let prompt = '';
  if (context.timezone) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = localDayParts(new Date(), context.timezone);
    prompt += `Today is ${days[parts.dayOfWeek]}, ${months[parts.month - 1]} ${parts.dayOfMonth} (${context.timezone}).\n`;
  }

  prompt += `You are a relationship coach. Your job is to help the user understand and delight their partner, ${context.name}, using only the information provided in the profile records below.\n\n`;

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