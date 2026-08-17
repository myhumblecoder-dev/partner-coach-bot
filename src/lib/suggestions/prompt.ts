import type { ProfileContext } from '@/lib/profile/context';

export type SuggestionKind = 'date' | 'gift' | 'trip';
export type Audience = 'for_her' | 'for_us' | 'for_family';

export function buildSuggestionPrompt(
  context: ProfileContext,
  existing: string[],
  kind: SuggestionKind,
  audience: Audience
): string {
  const parts: string[] = [];

  parts.push(`Generate exactly one new ${kind} suggestion ${audience.replace('_', ' ')} for ${context.name}.`);

  if (context.likes.length > 0) {
    parts.push(`Context for ${context.name}: Likes: ${context.likes.join(', ')}.`);
  }

  if (existing.length > 0) {
    parts.push(`Existing suggestions to avoid repeating: ${existing.join(', ')}.`);
    parts.push('Do not repeat any of these existing suggestions.');
  }

  return parts.join(' ');
}