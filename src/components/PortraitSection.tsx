import React from 'react';

interface PortraitSectionProps {
  title: string;
  items: string[];
}

export default function PortraitSection({ title, items }: PortraitSectionProps) {
  return (
    <section data-testid="portrait-section">
      <h2 className="mb-3 font-display text-lg text-ink">
        {title}
        <span className="ml-2 align-middle text-xs font-sans text-ink-soft">
          {items.length > 0 ? items.length : ''}
        </span>
      </h2>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm leading-6 text-ink"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-ink-soft">Nothing here yet.</p>
      )}
    </section>
  );
}
