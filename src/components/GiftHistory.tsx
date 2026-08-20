'use client'

import { rateGift } from '@/app/actions/rateGift'
import { deleteEntry } from '@/app/actions/editEntry'
import type { GiftRow } from '@/lib/portrait/load'

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

function Badge({ howItLanded }: { howItLanded: string | null }) {
  return (
    <span
      data-testid="gift-outcome"
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE[outcome(howItLanded)]}`}
    >
      {outcome(howItLanded)}
    </span>
  )
}

export default function GiftHistory({
  gifts,
  rows,
}: {
  gifts: Gift[]
  rows?: GiftRow[]
}) {
  const list = rows ?? gifts
  if (list.length === 0) {
    return <p className="text-sm italic text-ink-soft">No gifts logged yet.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {list.map((gift, i) => (
        <li
          key={rows ? (gift as GiftRow).id : i}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <span className="text-sm text-ink">{gift.description}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Badge howItLanded={gift.howItLanded} />
            {rows && (
              <button
                aria-label={`Delete ${gift.description}`}
                onClick={() => deleteEntry('gifts', (gift as GiftRow).id)}
                className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft hover:bg-paper"
              >
                ✕
              </button>
            )}
            {rows && gift.howItLanded === null && (
              <>
                <button
                  aria-label={`Mark ${gift.description} landed`}
                  onClick={() => rateGift((gift as GiftRow).id, 'hit')}
                  className="rounded-full border border-good/30 px-2 py-0.5 text-xs text-good hover:bg-good/10"
                >
                  landed
                </button>
                <button
                  aria-label={`Mark ${gift.description} missed`}
                  onClick={() => rateGift((gift as GiftRow).id, 'miss')}
                  className="rounded-full border border-bad/30 px-2 py-0.5 text-xs text-bad hover:bg-bad/10"
                >
                  missed
                </button>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
