import React from 'react';

interface PortraitSectionProps {
  title: string;
  items: string[];
}

export default function PortraitSection({ title, items }: PortraitSectionProps) {
  return (
    <section data-testid="portrait-section" className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {items.length > 0 ? (
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">Nothing here yet.</p>
      )}
    </section>
  );
}