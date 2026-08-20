import { generate } from '@/lib/ai'

export type IdeaAsk = {
  kind: 'date' | 'gift' | 'trip'
  audience: 'for_her' | 'for_us' | 'for_family'
}

const KINDS = new Set(['date', 'gift', 'trip'])
const AUDIENCES = new Set(['for_her', 'for_us', 'for_family'])

/** Is this message asking for a concrete idea? null on anything unclear —
 * detection failing must never break the conversation. */
export async function detectIdeaAsk(message: string): Promise<IdeaAsk | null> {
  try {
    const raw = await generate(
      'Is the following message a request for a concrete date, gift, or ' +
      'trip idea for the sender\'s partner? Reply NONE if not. Otherwise ' +
      'reply exactly two words: the kind (date, gift, or trip) and the ' +
      'audience (for_her when it is for the partner alone, for_us for the ' +
      'couple, for_family for the whole family; use for_us when unclear).' +
      `\n\nMessage: "${message}"`)
    const words = raw.trim().toLowerCase().split(/\s+/)
    if (!words[0] || words[0] === 'none' || !KINDS.has(words[0])) return null
    const audience = words[1] && AUDIENCES.has(words[1]) ? words[1] : 'for_us'
    return {
      kind: words[0] as IdeaAsk['kind'],
      audience: audience as IdeaAsk['audience'],
    }
  } catch {
    return null
  }
}
