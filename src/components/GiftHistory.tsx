type Gift = {
  description: string
  givenAt: Date | null
  howItLanded: string | null
}

function outcome(howItLanded: string | null): string {
  if (howItLanded === 'hit') return 'landed'
  if (howItLanded === 'miss') return 'missed'
  return 'unrated'
}

const BADGE: Record<string, string> = {
  landed: 'border-good/30 bg-good/10 text-good',
  missed: 'border-bad/30 bg-bad/10 text-bad',
  unrated: 'border-line bg-paper text-ink-soft',
}

export default function GiftHistory({ gifts }: { gifts: Gift[] }) {
  if (gifts.length === 0) {
    return <p className="text-sm italic text-ink-soft">No gifts logged yet.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {gifts.map((gift, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <span className="text-sm text-ink">{gift.description}</span>
          <span
            data-testid="gift-outcome"
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE[outcome(gift.howItLanded)]}`}
          >
            {outcome(gift.howItLanded)}
          </span>
        </li>
      ))}
    </ul>
  )
}
