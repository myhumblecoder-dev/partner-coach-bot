'use client'

import { useState } from 'react'
import { addEntry, type EntryField } from '@/app/actions/addEntry'

const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink ' +
  'placeholder:text-ink-soft/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

export default function EntryForm({ profileId }: { profileId: string }) {
  const [field, setField] = useState<EntryField>('likes')
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await addEntry(profileId, field, text)
    if (result.ok) {
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="field-select" className="text-sm font-medium text-ink">
          Add to
        </label>
        <select
          id="field-select"
          value={field}
          onChange={(e) => setField(e.target.value as EntryField)}
          className={inputClass}
        >
          <option value="likes">likes</option>
          <option value="dislikes">dislikes</option>
          <option value="jokes">jokes</option>
          <option value="dreams">dreams</option>
          <option value="gifts">gifts</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="entry-text" className="text-sm font-medium text-ink">
          Entry
        </label>
        <input
          id="entry-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="something you noticed"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
      >
        Add entry
      </button>
    </form>
  )
}
