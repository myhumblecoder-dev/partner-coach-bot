'use client'

import { useState } from 'react'
import { addMood } from '@/app/actions/addMood'

interface MoodFormProps {
  profileId: string
}

export default function MoodForm({ profileId }: MoodFormProps) {
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
      <div className="flex flex-col gap-1">
        <label htmlFor="mood-input" className="text-sm font-medium">
          Mood
        </label>
        <input
          id="mood-input"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note-input" className="text-sm font-medium">
          Note
        </label>
        <input
          id="note-input"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py/2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Add mood
      </button>
    </form>
  )
}