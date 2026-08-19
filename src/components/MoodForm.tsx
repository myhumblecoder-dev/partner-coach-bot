'use client'

import { useState } from 'react'
import { addMood } from '@/app/actions/addMood'

const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink ' +
  'placeholder:text-ink-soft/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

export default function MoodForm({ profileId }: { profileId: string }) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await addMood(profileId, label, note || null)
    if (result.ok) {
      setLabel('')
      setNote('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="mood-input" className="text-sm font-medium text-ink">
          Mood
        </label>
        <input
          id="mood-input"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="content, stressed, playful…"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note-input" className="text-sm font-medium text-ink">
          Note
        </label>
        <input
          id="note-input"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="what was happening?"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
      >
        Add mood
      </button>
    </form>
  )
}
