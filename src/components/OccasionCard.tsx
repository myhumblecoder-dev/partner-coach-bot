'use client'

import { useState } from 'react'
import { addOccasion } from '@/app/actions/addOccasion'

export type OccasionView = { label: string; month: number; day: number }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]

const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink ' +
  'placeholder:text-ink-soft/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

export default function OccasionCard({
  profileId,
  occasions,
}: {
  profileId: string
  occasions: OccasionView[]
}) {
  const [kind, setKind] = useState('birthday')
  const [label, setLabel] = useState('')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await addOccasion(profileId, kind, label, month, day)
    if (result.ok) setLabel('')
  }

  return (
    <div>
      {occasions.length > 0 ? (
        <ul className="mb-5 space-y-2">
          {occasions.map((o, i) => (
            <li
              key={i}
              data-testid="occasion-row"
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-ink">{o.label}</span>
              <span className="font-mono text-xs text-ink-soft">
                {MONTHS[o.month - 1]} {o.day}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-sm italic text-ink-soft">
          No occasions yet — add her birthday and your anniversary.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="occasion-kind" className="text-sm font-medium text-ink">
              Kind
            </label>
            <select
              id="occasion-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className={inputClass}
            >
              <option value="birthday">birthday</option>
              <option value="anniversary">anniversary</option>
              <option value="other">other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="occasion-label" className="text-sm font-medium text-ink">
              Label
            </label>
            <input
              id="occasion-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="her birthday"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="occasion-month" className="text-sm font-medium text-ink">
              Month
            </label>
            <select
              id="occasion-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={inputClass}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="occasion-day" className="text-sm font-medium text-ink">
              Day
            </label>
            <input
              id="occasion-day"
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Add occasion
        </button>
      </form>
    </div>
  )
}
