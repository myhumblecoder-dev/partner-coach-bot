'use client'

import { useState } from 'react'
import { addEntry, type EntryField } from '@/app/actions/addEntry'

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
      <div>
        <label htmlFor="field-select" className="block text-sm font-medium text-gray-700">
          Add to
        </label>
        <select
          id="field-select"
          value={field}
          onChange={(e) => setField(e.target.value as EntryField)}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        >
          <option value="likes">likes</option>
          <option value="dislikes">dislikes</option>
          <option value="jokes">jokes</option>
          <option value="dreams">dreams</option>
        </select>
      </div>

      <div>
        <label htmlFor="entry-text" className="block text-sm font-medium text-gray-700">
          Entry
        </label>
        <input
          id="entry-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Add entry
      </button>
    </form>
  )
}
