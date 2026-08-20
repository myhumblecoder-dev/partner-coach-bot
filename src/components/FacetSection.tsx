'use client'

import { useState } from 'react'
import EditableChip from '@/components/EditableChip'
import type { EditableField } from '@/app/actions/editEntry'
import type { FacetView, EntryRow } from '@/lib/portrait/load'

function Chips({ field, rows }: { field: EditableField; rows: EntryRow[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {rows.map((row) => (
        <li key={row.id}>
          <EditableChip field={field} id={row.id} text={row.text} source={row.source} />
        </li>
      ))}
    </ul>
  )
}

export default function FacetSection({
  title,
  field,
  facets,
  rows,
}: {
  title: string
  field: EditableField
  facets: FacetView[]
  rows: EntryRow[]
}) {
  const [notesOpen, setNotesOpen] = useState(false)

  return (
    <section data-testid="portrait-section">
      <h2 className="mb-3 font-display text-lg text-ink">{title}</h2>

      {facets.length > 0 ? (
        <>
          <ul className="space-y-1.5">
            {facets.map((facet) => (
              <li
                key={facet.id}
                data-testid="facet-row"
                className={`flex items-baseline gap-2 text-sm ${
                  facet.status === 'stale' ? 'text-ink-soft' : 'text-ink'
                }`}
              >
                <span>{facet.label}</span>
                <span className="text-xs text-ink-soft">×{facet.evidenceCount}</span>
                {facet.status === 'stale' && (
                  <span className="text-xs italic text-ink-soft">fading</span>
                )}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setNotesOpen((open) => !open)}
            className="mt-3 text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            Field notes ({rows.length})
          </button>
          {notesOpen && (
            <div className="mt-3">
              <Chips field={field} rows={rows} />
            </div>
          )}
        </>
      ) : rows.length > 0 ? (
        <Chips field={field} rows={rows} />
      ) : (
        <p className="text-sm italic text-ink-soft">Nothing here yet.</p>
      )}
    </section>
  )
}
