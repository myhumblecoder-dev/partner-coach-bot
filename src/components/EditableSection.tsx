import React from 'react';
import EditableChip from '@/components/EditableChip';
import type { EditableField } from '@/app/actions/editEntry';
import type { EntryRow } from '@/lib/portrait/load';

interface EditableSectionProps {
  title: string;
  field: EditableField;
  rows: EntryRow[];
}

export default function EditableSection({ title, field, rows }: EditableSectionProps) {
  return (
    <section data-testid="portrait-section" className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <EditableChip
                field={field}
                id={row.id}
                text={row.text}
                source={row.source}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}