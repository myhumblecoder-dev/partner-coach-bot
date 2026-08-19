import React from 'react';
import type { Coverage } from '@/lib/metrics/coverage';
import type { GiftStats } from '@/lib/metrics/gifts';

interface StudyMetricsProps {
  coverage: Coverage;
  daysSinceTouch: number | null;
  gifts: GiftStats;
}

const Recency = ({ days }: { days: number | null }) => {
  if (days === null) return <>Never updated</>;
  if (days === 0) return <>Updated today</>;
  return <>Updated {days} {days === 1 ? 'day' : 'days'} ago</>;
};

const Gifts = ({ stats }: { stats: GiftStats }) => {
  if (stats.successRate === null) return <>No gifts rated yet</>;
  const rated = stats.hits + stats.misses;
  return (
    <>
      {stats.hits} of {rated} gifts landed
    </>
  );
};

function Stat({
  label,
  children,
  footer,
}: {
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1.5 font-display text-xl text-ink">{children}</p>
      {footer}
    </div>
  );
}

export default function StudyMetrics({
  coverage,
  daysSinceTouch,
  gifts,
}: StudyMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat
        label="Coverage"
        footer={
          coverage.gaps.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {coverage.gaps.map((gap) => (
                <span
                  key={gap}
                  data-testid="coverage-gap"
                  className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                >
                  {gap}
                </span>
              ))}
            </div>
          ) : undefined
        }
      >
        {coverage.filled} of {coverage.total} areas filled
      </Stat>

      <Stat label="Recency">
        <Recency days={daysSinceTouch} />
      </Stat>

      <Stat label="Gifts">
        <Gifts stats={gifts} />
      </Stat>
    </div>
  );
}
