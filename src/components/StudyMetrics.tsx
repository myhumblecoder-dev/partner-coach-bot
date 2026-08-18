import React from 'react';
import type { Coverage } from '@/lib/metrics/coverage';
import type { GiftStats } from '@/lib/metrics/gifts';

interface StudyMetricsProps {
  coverage: Coverage;
  daysSinceTouch: number | null;
  gifts: GiftStats;
}

const Recency = ({ days }: { days: number | null }) => {
  if (days === null) return <span>Never updated</span>;
  if (days === 0) return <span>Updated today</span>;
  return <span>Updated {days} days ago</span>;
};

const Gifts = ({ stats }: { stats: GiftStats }) => {
  if (stats.successRate === null) return <span>No gifts rated yet</span>;
  const rated = stats.hits + stats.misses;
  return <span>{stats.hits} of {rated} gifts landed</span>;
};

export default function StudyMetrics({ coverage, daysSinceTouch, gifts }: StudyMetricsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">Coverage</p>
        <p className="text-sm text-slate-600">
          {coverage.filled} of {coverage.total} areas filled
        </p>
        {coverage.gaps.map((gap) => (
          <div key={gap} data-testid="coverage-gap" className="text-xs text-red-600">
            {gap}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">Recency</p>
        <Recency days={daysSinceTouch} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">Gifts</p>
        <Gifts stats={gifts} />
      </div>
    </div>
  );
}