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

export default function GiftHistory({ gifts }: { gifts: Gift[] }) {
  if (gifts.length === 0) {
    return <p>No gifts logged yet.</p>
  }
  return (
    <ul className="space-y-2">
      {gifts.map((gift, i) => (
        <li key={i} className="flex items-center justify-between gap-2 text-sm">
          <span>{gift.description}</span>
          <span data-testid="gift-outcome" className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
            {outcome(gift.howItLanded)}
          </span>
        </li>
      ))}
    </ul>
  )
}
