'use client';

import { useState, KeyboardEvent } from 'react';
import { updateEntry, deleteEntry, type EditableField } from '@/app/actions/editEntry';

interface EditableChipProps {
  field: EditableField;
  id: string;
  text: string;
  source: string;
}

export default function EditableChip({ field, id, text, source }: EditableChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(text);

  const handleSave = async () => {
    await updateEntry(field, id, val);
    setIsEditing(false);
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await handleSave();
    } else if (e.key === 'Escape') {
      setVal(text);
      setIsEditing(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm">
      {isEditing ? (
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-auto bg-transparent px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${text}`}
          className="font-medium text-gray-900"
        >
          {text}
        </button>
      )}
      <button
        onClick={() => deleteEntry(field, id)}
        aria-label={`Delete ${text}`}
        className="text-gray-400 hover:text-red-500"
      >
        &times;
      </button>
      {source === 'extracted' && (
        <span
          data-testid="source-marker"
          className="text-[10px] font-bold uppercase text-emerald-600"
        >
          ai
        </span>
      )}
    </div>
  );
}